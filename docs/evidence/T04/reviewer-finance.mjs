import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {PLANNED_EXPENSES,PRODUCTS,FINANCE_SCENARIOS,ACTUAL_FINANCE,OFFICIAL_CONTACT} from '../../../src/data/campaign.ts';
import {sumPlannedExpenses,calculateTotalRevenueScenario,calculateScenario,formatVND} from '../../../src/lib/finance.ts';

const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const oracle=JSON.parse(fs.readFileSync('docs/evidence/T03/source-calculations.json','utf8').replace(/^\uFEFF/,''));
const actualBefore=JSON.stringify(ACTUAL_FINANCE),contactBefore=JSON.stringify(OFFICIAL_CONTACT);
const expense=sumPlannedExpenses(PLANNED_EXPENSES),revenue=calculateTotalRevenueScenario(PRODUCTS);
assert.equal(expense,oracle.plannedExpense);
assert.equal(revenue,oracle.hypotheticalSoldOutRevenue);
assert.ok(PLANNED_EXPENSES.every(item=>Number.isInteger(item.amount.value)&&item.amount.kind==='planned'&&item.amount.verification==='unverified'&&item.amount.updatedAt===null));

const scenarios=FINANCE_SCENARIOS.map(scenario=>{
  const expected=oracle.scenarios.find(item=>item.inKindReplacingCashExpense===scenario.inKindReplacement.value);
  assert.ok(expected,'Scenario must correspond to the proposal, not a made-up sponsorship');
  const result=calculateScenario(scenario,revenue,expense);
  assert.ok(result);
  assert.equal(result.projectedRevenue,revenue,'In-kind must not become cash revenue');
  assert.equal(result.remainingCashExpense,expected.remainingCashExpense);
  assert.equal(result.projectedBalance,expected.hypotheticalCashBalance);
  assert.equal(result.isDeficit,expected.hypotheticalCashBalance<0);
  return {id:scenario.id,...result};
});
assert.equal(scenarios.length,3);
const deficit=scenarios.find(item=>item.projectedBalance<0);
assert.ok(deficit);assert.match(deficit.balanceText,/Thiếu 220\.000đ/);

const unknownReplacement=structuredClone(FINANCE_SCENARIOS[0]);
unknownReplacement.inKindReplacement.value=null;
assert.equal(calculateScenario(unknownReplacement,revenue,expense),null,'Unknown replacement must not turn into zero');
assert.equal(formatVND(null),'Chưa xác nhận');
assert.equal(formatVND(0),'0đ','Explicit known zero is different from unknown');
const breakeven=calculateScenario(FINANCE_SCENARIOS[0],expense,expense);
assert.ok(breakeven);assert.equal(breakeven.balanceText,'Hòa vốn 0đ');

for(const field of ['actualCashReceived','actualCashSpent','actualCashBalance','actualInKindReceived','actualInKindDelivered']){
  const fact=ACTUAL_FINANCE[field];
  assert.equal(fact.value,null);assert.equal(fact.kind,'actual');assert.equal(fact.verification,'unverified');
  assert.equal(fact.sourceRef,null);assert.equal(fact.updatedAt,null);assert.equal(fact.publicApproval,'pending');
}
assert.equal(ACTUAL_FINANCE.vouchersCount,null);
assert.equal(OFFICIAL_CONTACT.email,null);assert.equal(OFFICIAL_CONTACT.phone,null);assert.equal(OFFICIAL_CONTACT.representative,null);
assert.equal(OFFICIAL_CONTACT.status,'unconfirmed');
assert.equal(JSON.stringify(ACTUAL_FINANCE),actualBefore,'Planning calculations must not alter actual ledger');
assert.equal(JSON.stringify(OFFICIAL_CONTACT),contactBefore);

const result={sha,checkedAt:new Date().toISOString(),source:'source-calculations.json; independent arithmetic from docs/data-and-finance.md',expense,revenue,scenarios,unknownReplacementResult:null,actualFinance:ACTUAL_FINANCE,contact:OFFICIAL_CONTACT,actualAndContactUnchanged:true};
fs.writeFileSync('docs/evidence/T04/reviewer-finance-'+sha.slice(0,7)+'.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({sha,expense,revenue,balances:scenarios.map(item=>item.projectedBalance),actualAndContactUnchanged:true}));
