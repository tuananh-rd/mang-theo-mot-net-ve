// Independent review only. Calls local imported handlers with an in-memory SQLite emulator.
// Request URLs below are inert Request objects: this script performs no network fetch or email send.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const apiRoot=path.resolve(process.argv[2]||'../public-phone-api/apps/studio');
const {LocalD1Database}=await import(pathToFileURL(path.join(apiRoot,'dist/db/emulator.js')));
const {handlePublicPreorderRequest}=await import(pathToFileURL(path.join(apiRoot,'dist/preorders/service.js')));
const {handlePreorderAdminRequest}=await import(pathToFileURL(path.join(apiRoot,'dist/preorders/admin.js')));
const db=new LocalD1Database(':memory:',fs.readFileSync(path.join(apiRoot,'src/db/schema.sql'),'utf8'));
const result={at:new Date().toISOString(),method:'Independent imported compiled API handlers; fresh in-memory LocalD1Database; no network, real D1/R2 or email binding',cases:[]};
const origin='http://127.0.0.1:4383';let serial=0;
const input=(extra={})=>({productId:'moc-khoa',quantity:1,name:'Kiểm thử cục bộ',email:'review@example.test',phone:'0984 441 726',contactType:'phone',contact:'0984 441 726',pickup:'Nhóm xác nhận',consent:true,note:'',...extra});
async function api(body,key=`review-${++serial}`,database=db,requestOrigin=origin){
 const request=new Request('http://127.0.0.1:4331/api/preorders',{method:'POST',headers:{'Content-Type':'application/json',Origin:requestOrigin,'Idempotency-Key':key,'CF-Connecting-IP':'127.0.0.25'},body:JSON.stringify(body)});
 const response=await handlePublicPreorderRequest(request,database,{siteOrigin:origin,isTest:true,rateLimitSalt:'independent-local-fixture'});return{status:response.status,body:await response.json()};
}
try{
 await db.prepare('UPDATE preorder_products SET is_open=1,official_price=?,pickup=? WHERE product_id=?').bind(10000,'Nhóm xác nhận','moc-khoa').run();
 for(const [name,value]of [['missing',undefined],['null',null],['empty',''],['whitespace','   '],['number',984441726],['object',{}],['array',['0984441726']],['separators',' () . - '],['letters','not-a-phone'],['short','1234'],['double-plus','++84984441726'],['control','0984\u0000441726']]){
  const response=await api(input({phone:value}));result.cases.push({name,status:response.status,error:response.body.error});assert.equal(response.status,400,name);assert.match(response.body.error,/điện thoại/iu,name);
 }
 const local=await api(input({price:1,unitPrice:1}), 'review-valid-local');assert.equal(local.status,201);assert.equal(local.body.preorder.unitPrice,10000);assert.equal(local.body.emailStatus,'skipped');result.cases.push({name:'valid-local-server-price',status:local.status,price:local.body.preorder.unitPrice,email:local.body.emailStatus});
 const duplicate=await api(input(),'review-valid-local');assert.equal(duplicate.status,200);assert.equal(duplicate.body.preorder.id,local.body.preorder.id);assert.equal(duplicate.body.duplicate,true);result.cases.push({name:'idempotent-retry',status:duplicate.status,duplicate:true});
 const international=await api(input({phone:'+84 984 441 726'}));assert.equal(international.status,201);result.cases.push({name:'valid-international',status:international.status});
 const noEmail=await api(input({email:''}));assert.equal(noEmail.status,400);assert.match(noEmail.body.error,/email/iu);result.cases.push({name:'email-still-required',status:noEmail.status});
 const bot=await api(input({website:'bot-filled'}));assert.equal(bot.status,400);result.cases.push({name:'honeypot',status:bot.status});
 const foreign=await api(input(),undefined,db,'http://example.invalid');assert.equal(foreign.status,403);result.cases.push({name:'foreign-origin',status:foreign.status});
 const failed=await api(input(),'review-error',{prepare(){throw new Error('fixture database failure')}});assert.equal(failed.status,503);result.cases.push({name:'fixture-server-error',status:failed.status,error:failed.body.error});
 // Simulate an already-existing no-phone row ONLY inside the fresh in-memory review fixture.
 await db.prepare('UPDATE preorder_email_state SET customer_phone=NULL WHERE preorder_id=?').bind(local.body.preorder.id).run();
 const session={user:{email:'reviewer@example.test',role:'reviewer'},isDev:true,expiresAt:Date.now()+60000};
 const req=(pathname,method='GET',body)=>new Request('http://studio.local'+pathname,{method,headers:{Origin:'http://studio.local','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 const listing=await handlePreorderAdminRequest(req('/api/preorders?test=true'),db,session);assert.equal(listing.status,200);assert.equal((await listing.json()).preorders.length,2);
 const changed=await handlePreorderAdminRequest(req(`/api/preorders/${local.body.preorder.id}/status`,'POST',{status:'contacted'}),db,session);assert.equal(changed.status,200);
 const csv=await handlePreorderAdminRequest(req('/api/preorders/export.csv?test=true'),db,{...session,user:{email:'admin@example.test',role:'admin'}});assert.equal(csv.status,200);assert.match(await csv.text(),/order_code/);
 const stillNull=await db.prepare('SELECT customer_phone FROM preorder_email_state WHERE preorder_id=?').bind(local.body.preorder.id).first();assert.equal(stillNull.customer_phone,null);
 result.cases.push({name:'historical-null-phone-list-manage-export',list:listing.status,manage:changed.status,export:csv.status,phoneRemainsNull:true});
 const count=await db.prepare('SELECT COUNT(*) AS count FROM preorders').first();assert.equal(count.count,2);result.persistedFixtureOrders=count.count;result.passed=true;
}catch(error){result.passed=false;result.failure=String(error);process.exitCode=1;}finally{db.close();fs.writeFileSync('docs/evidence/P1/review/api-review.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));}
