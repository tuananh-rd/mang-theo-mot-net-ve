/**
 * Tích hợp Xuất bản qua GitHub (GitHub Pull Request & Deployment Publisher) - Task C17-R2-F3
 * Tạo Git Tree, Commit, Branch và Pull Request chứa Snapshot xuất bản đã được duyệt.
 * Tuân thủ nguyên tắc:
 * - Không bao giờ ghi trực tiếp vào nhánh main hoặc force-update refs.
 * - Bảo tồn toàn bộ cây git cơ sở (base tree) và các thay đổi trước đó trên main.
 * - Hỗ trợ retry mang tính idempotent, phát hiện xung đột nhánh (conflicting branch).
 * - Làm sạch token (token scrubbing) trong mọi thông điệp lỗi để bảo mật thông tin.
 * - Cho phép tiêm fetch fixture trong môi trường kiểm thử (test environment).
 */

import type { PublicationRecord, Env } from '../types.js';

export interface AssetBlobItem {
  path: string;
  content?: string;
  contentBase64?: string;
  blobSha?: string;
}

export interface GitHubPublishOptions {
  repoOwner?: string;
  repoName?: string;
  baseBranch?: string;
  token?: string;
  fetchFn?: typeof fetch;
  assetsToPublish?: AssetBlobItem[];
  simulateFixture?: boolean;
}

export type GitHubPublishStage =
  | 'init'
  | 'base_ref'
  | 'base_commit'
  | 'blobs'
  | 'tree'
  | 'commit'
  | 'branch_ref'
  | 'pull_request'
  | 'completed';

export type GitHubPublishErrorCode =
  | 'not_configured'
  | 'api_error'
  | 'malformed_response'
  | 'conflicting_branch'
  | 'network_error';

export interface GitHubPublishResult {
  success: boolean;
  stage: GitHubPublishStage;
  branchName: string;
  baseCommitSha?: string;
  baseTreeSha?: string;
  treeSha?: string;
  commitSha?: string;
  prUrl?: string;
  prNumber?: number;
  isReusedBranch?: boolean;
  isReusedPr?: boolean;
  isSimulated?: boolean;
  errorCode?: GitHubPublishErrorCode;
  error?: string;
  message?: string;
}

/**
 * Xóa bỏ mã token hoặc header xác thực khỏi chuỗi thông báo lỗi (Token Scrubbing)
 */
export function scrubToken(text: string, token?: string): string {
  if (!text) return '';
  let result = text;
  if (token && token.trim()) {
    result = result.replaceAll(token.trim(), '[REDACTED_TOKEN]');
  }
  result = result.replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED_TOKEN]');
  result = result.replace(/token\s+[a-zA-Z0-9_\-\.]+/gi, 'token [REDACTED_TOKEN]');
  return result;
}

/**
 * Tạo Git Tree, Commit, Branch và Pull Request xuất bản trên GitHub với khả năng khôi phục từng bước
 */
export async function triggerGitHubPublication(
  publication: PublicationRecord,
  env: Env,
  options: GitHubPublishOptions = {}
): Promise<GitHubPublishResult> {
  const branchName = `studio/publish-${publication.id}`;
  const commitMsg = `chore(release): xuất bản snapshot nội dung studio (${publication.snapshot.sha256.slice(0, 8)})`;

  const token = options.token || env.GITHUB_TOKEN;
  const fetchFn = options.fetchFn || globalThis.fetch;

  // 1. Khi thiếu GITHUB_TOKEN
  if (!token) {
    if (options.simulateFixture) {
      const owner = options.repoOwner || env.GITHUB_OWNER || 'tuananh-rd';
      const repo = options.repoName || env.GITHUB_REPO || 'mang-theo-mot-net-ve';
      return {
        success: true,
        stage: 'completed',
        isSimulated: true,
        branchName,
        commitSha: `sim-${publication.snapshot.sha256.slice(0, 12)}`,
        prUrl: `https://github.com/${owner}/${repo}/pull/simulated-${publication.id}`,
        message: 'Mô phỏng xuất bản thành công trong môi trường kiểm thử (fixture).',
      };
    }
    return {
      success: false,
      stage: 'init',
      branchName,
      errorCode: 'not_configured',
      error: 'GitHub credentials (GITHUB_TOKEN) are not configured.',
      message: 'GitHub credentials are not configured.',
    };
  }

  const owner = options.repoOwner || env.GITHUB_OWNER || 'tuananh-rd';
  const repo = options.repoName || env.GITHUB_REPO || 'mang-theo-mot-net-ve';
  const base = options.baseBranch || env.GITHUB_BASE_BRANCH || 'main';

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'MangTheoMotNetVe-Studio/1.0',
    'Content-Type': 'application/json',
  };

  let baseCommitSha: string | undefined;
  let baseTreeSha: string | undefined;
  let newTreeSha: string | undefined;
  let newCommitSha: string | undefined;
  let isReusedBranch = false;
  let isReusedPr = false;

  try {
    // Bước 1: Đọc base ref để lấy commit SHA cơ sở
    const refRes = await fetchFn(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${base}`, { headers });
    if (!refRes.ok) {
      const errText = await refRes.text();
      return {
        success: false,
        stage: 'base_ref',
        branchName,
        errorCode: 'api_error',
        error: scrubToken(`Không thể đọc branch '${base}': ${errText}`, token),
      };
    }
    const refData = (await refRes.json().catch(() => null)) as any;
    if (!refData || typeof refData !== 'object' || !refData.object?.sha) {
      return {
        success: false,
        stage: 'base_ref',
        branchName,
        errorCode: 'malformed_response',
        error: 'Phản hồi từ GitHub ref/heads không chứa SHA hợp lệ.',
      };
    }
    baseCommitSha = refData.object.sha;

    // Bước 2: Đọc base commit để lấy base tree SHA
    const commitRes = await fetchFn(`https://api.github.com/repos/${owner}/${repo}/git/commits/${baseCommitSha}`, { headers });
    if (!commitRes.ok) {
      const errText = await commitRes.text();
      return {
        success: false,
        stage: 'base_commit',
        branchName,
        baseCommitSha,
        errorCode: 'api_error',
        error: scrubToken(`Không thể đọc commit '${baseCommitSha}': ${errText}`, token),
      };
    }
    const commitData = (await commitRes.json().catch(() => null)) as any;
    if (!commitData || typeof commitData !== 'object' || !commitData.tree?.sha) {
      return {
        success: false,
        stage: 'base_commit',
        branchName,
        baseCommitSha,
        errorCode: 'malformed_response',
        error: 'Phản hồi từ GitHub git/commits không chứa tree SHA hợp lệ.',
      };
    }
    baseTreeSha = commitData.tree.sha;

    // Bước 3: Tạo Git Blobs cho các tệp media đã duyệt nếu có
    const additionalTreeEntries: Array<{ path: string; mode: string; type: string; sha?: string; content?: string }> = [];
    if (Array.isArray(options.assetsToPublish) && options.assetsToPublish.length > 0) {
      for (const asset of options.assetsToPublish) {
        if (asset.blobSha) {
          additionalTreeEntries.push({
            path: asset.path,
            mode: '100644',
            type: 'blob',
            sha: asset.blobSha,
          });
        } else if (asset.contentBase64) {
          const blobRes = await fetchFn(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ content: asset.contentBase64, encoding: 'base64' }),
          });
          if (!blobRes.ok) {
            const errText = await blobRes.text();
            return {
              success: false,
              stage: 'blobs',
              branchName,
              baseCommitSha,
              baseTreeSha,
              errorCode: 'api_error',
              error: scrubToken(`Không thể tạo blob cho asset '${asset.path}': ${errText}`, token),
            };
          }
          const blobData = (await blobRes.json().catch(() => null)) as any;
          if (!blobData || !blobData.sha) {
            return {
              success: false,
              stage: 'blobs',
              branchName,
              baseCommitSha,
              baseTreeSha,
              errorCode: 'malformed_response',
              error: `Phản hồi tạo blob cho '${asset.path}' không chứa SHA.`,
            };
          }
          additionalTreeEntries.push({
            path: asset.path,
            mode: '100644',
            type: 'blob',
            sha: blobData.sha,
          });
        } else if (asset.content) {
          additionalTreeEntries.push({
            path: asset.path,
            mode: '100644',
            type: 'blob',
            content: asset.content,
          });
        }
      }
    }

    // Bước 4: Tạo Git Tree mới chứa các tệp snapshot công khai và bảo tồn base_tree
    const treePayload = {
      base_tree: baseTreeSha,
      tree: [
        {
          path: 'src/data/published-snapshot.json',
          mode: '100644',
          type: 'blob',
          content: JSON.stringify(publication.snapshot, null, 2),
        },
        {
          path: 'src/data/journal-entries.json',
          mode: '100644',
          type: 'blob',
          content: JSON.stringify(publication.snapshot.modules?.journal || [], null, 2),
        },
        {
          path: 'src/data/product-sales-config.json',
          mode: '100644',
          type: 'blob',
          content: JSON.stringify(publication.snapshot.modules?.products || {}, null, 2),
        },
        ...additionalTreeEntries,
      ],
    };

    const treeRes = await fetchFn(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify(treePayload),
    });
    if (!treeRes.ok) {
      const errText = await treeRes.text();
      return {
        success: false,
        stage: 'tree',
        branchName,
        baseCommitSha,
        baseTreeSha,
        errorCode: 'api_error',
        error: scrubToken(`Không thể tạo git tree: ${errText}`, token),
      };
    }
    const treeData = (await treeRes.json().catch(() => null)) as any;
    if (!treeData || typeof treeData !== 'object' || !treeData.sha) {
      return {
        success: false,
        stage: 'tree',
        branchName,
        baseCommitSha,
        baseTreeSha,
        errorCode: 'malformed_response',
        error: 'Phản hồi tạo git tree không chứa SHA hợp lệ.',
      };
    }
    newTreeSha = treeData.sha;

    // Bước 5: Tạo Git Commit mới trỏ tới new tree và parent là base commit
    const newCommitRes = await fetchFn(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: commitMsg,
        tree: newTreeSha,
        parents: [baseCommitSha],
      }),
    });
    if (!newCommitRes.ok) {
      const errText = await newCommitRes.text();
      return {
        success: false,
        stage: 'commit',
        branchName,
        baseCommitSha,
        baseTreeSha,
        treeSha: newTreeSha,
        errorCode: 'api_error',
        error: scrubToken(`Không thể tạo git commit: ${errText}`, token),
      };
    }
    const newCommitData = (await newCommitRes.json().catch(() => null)) as any;
    if (!newCommitData || typeof newCommitData !== 'object' || !newCommitData.sha) {
      return {
        success: false,
        stage: 'commit',
        branchName,
        baseCommitSha,
        baseTreeSha,
        treeSha: newTreeSha,
        errorCode: 'malformed_response',
        error: 'Phản hồi tạo git commit không chứa SHA hợp lệ.',
      };
    }
    newCommitSha = newCommitData.sha;

    // Bước 6: Tạo hoặc kiểm tra cập nhật branch ref an toàn (Idempotent / No Force)
    const createRefRes = await fetchFn(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: newCommitSha,
      }),
    });

    if (!createRefRes.ok) {
      // Nhánh có thể đã tồn tại từ lần chạy trước -> Đọc nhánh hiện tại và kiểm tra tổ tiên (ancestry check)
      const existingRefRes = await fetchFn(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branchName}`, { headers });
      if (!existingRefRes.ok) {
        const createErr = await createRefRes.text();
        return {
          success: false,
          stage: 'branch_ref',
          branchName,
          baseCommitSha,
          treeSha: newTreeSha,
          commitSha: newCommitSha,
          errorCode: 'api_error',
          error: scrubToken(`Không thể tạo hoặc đọc nhánh '${branchName}': ${createErr}`, token),
        };
      }

      const existingRefData = (await existingRefRes.json().catch(() => null)) as any;
      const existingSha = existingRefData?.object?.sha;

      if (existingSha === newCommitSha) {
        // Nhánh đã trỏ chính xác tới commit mới tạo -> Tái sử dụng idempotent
        isReusedBranch = true;
      } else {
        // So sánh nhánh hiện có với commit mới (Compare commits để xác định xung đột)
        const compareRes = await fetchFn(`https://api.github.com/repos/${owner}/${repo}/compare/${existingSha}...${newCommitSha}`, { headers });
        let canFastForward = false;

        if (compareRes.ok) {
          const compareData = (await compareRes.json().catch(() => ({}))) as any;
          if (compareData.status === 'ahead' || compareData.status === 'identical' || existingSha === baseCommitSha) {
            canFastForward = true;
          }
        } else if (existingSha === baseCommitSha) {
          canFastForward = true;
        }

        if (canFastForward) {
          const patchRefRes = await fetchFn(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branchName}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ sha: newCommitSha, force: false }),
          });
          if (!patchRefRes.ok) {
            const patchErr = await patchRefRes.text();
            return {
              success: false,
              stage: 'branch_ref',
              branchName,
              baseCommitSha,
              treeSha: newTreeSha,
              commitSha: newCommitSha,
              errorCode: 'api_error',
              error: scrubToken(`Không thể cập nhật nhánh '${branchName}' (không force): ${patchErr}`, token),
            };
          }
        } else {
          // Nhánh đã tồn tại và có commit khác phân kỳ (diverged / conflict) -> Từ chối ghi đè
          return {
            success: false,
            stage: 'branch_ref',
            branchName,
            baseCommitSha,
            treeSha: newTreeSha,
            commitSha: newCommitSha,
            errorCode: 'conflicting_branch',
            error: `Nhánh '${branchName}' đã tồn tại với commit khác và không thể tua nhanh an toàn (xung đột lịch sử).`,
          };
        }
      }
    }

    // Bước 7: Tạo hoặc tái sử dụng Pull Request (Idempotent PR Handling)
    const prRes = await fetchFn(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: `[Content Studio] Xuất bản nội dung (${publication.id})`,
        head: branchName,
        base,
        body: `### Xuất bản Content Studio\n- **Mã yêu cầu:** \`${publication.id}\`\n- **Mã băm Snapshot:** \`${publication.snapshot.sha256}\`\n- **Trạng thái kiểm duyệt:** Đã thẩm định và phê duyệt hợp lệ (Two-Person Policy)\n- **Thời gian xuất bản:** ${new Date().toISOString()}`,
      }),
    });

    if (!prRes.ok) {
      const prErrText = await prRes.text();
      // Nếu PR đã tồn tại cho nhánh này -> Tra cứu PR hiện có để tái sử dụng
      if (prErrText.includes('already exists') || prRes.status === 422) {
        const listPrRes = await fetchFn(`https://api.github.com/repos/${owner}/${repo}/pulls?head=${owner}:${branchName}&base=${base}&state=all`, {
          method: 'GET',
          headers,
        });
        if (listPrRes.ok) {
          const prs = (await listPrRes.json().catch(() => [])) as any[];
          if (Array.isArray(prs) && prs.length > 0) {
            isReusedPr = true;
            return {
              success: true,
              stage: 'completed',
              branchName,
              baseCommitSha,
              baseTreeSha,
              treeSha: newTreeSha,
              commitSha: newCommitSha,
              prUrl: prs[0].html_url,
              prNumber: prs[0].number,
              isReusedBranch,
              isReusedPr,
              message: 'Tái sử dụng Pull Request đã tồn tại thành công (idempotent).',
            };
          }
        }
      }

      return {
        success: false,
        stage: 'pull_request',
        branchName,
        baseCommitSha,
        baseTreeSha,
        treeSha: newTreeSha,
        commitSha: newCommitSha,
        errorCode: 'api_error',
        error: scrubToken(`Lỗi tạo Pull Request: ${prErrText}`, token),
      };
    }

    const prData = (await prRes.json().catch(() => ({}))) as any;
    return {
      success: true,
      stage: 'completed',
      branchName,
      baseCommitSha,
      baseTreeSha,
      treeSha: newTreeSha,
      commitSha: newCommitSha,
      prUrl: prData.html_url,
      prNumber: prData.number,
      isReusedBranch,
      isReusedPr,
      message: 'Tạo Pull Request xuất bản GitHub thành công.',
    };
  } catch (err: any) {
    return {
      success: false,
      stage: 'completed',
      branchName,
      baseCommitSha,
      baseTreeSha,
      treeSha: newTreeSha,
      commitSha: newCommitSha,
      errorCode: 'network_error',
      error: scrubToken(err.message || 'Lỗi mạng khi kết nối GitHub API', token),
    };
  }
}
