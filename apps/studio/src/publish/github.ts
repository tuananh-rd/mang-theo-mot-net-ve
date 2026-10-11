/**
 * Tích hợp Xuất bản qua GitHub (GitHub Pull Request & Deployment Publisher)
 * Cho phép tạo branch và Pull Request chứa Snapshot xuất bản đã được duyệt (Task C17).
 */

import type { PublicationRecord, Env } from '../types.js';

export interface GitHubPublishOptions {
  repoOwner?: string;
  repoName?: string;
  baseBranch?: string;
  token?: string;
  simulateFixture?: boolean;
}

export interface GitHubPublishResult {
  success: boolean;
  isSimulated: boolean;
  branchName: string;
  prUrl?: string;
  commitSha?: string;
  error?: string;
  message?: string;
}

/**
 * Tạo Git Tree, Commit, Branch và Pull Request xuất bản trên GitHub
 */
export async function triggerGitHubPublication(
  publication: PublicationRecord,
  env: Env,
  options: GitHubPublishOptions = {}
): Promise<GitHubPublishResult> {
  const branchName = `studio/publish-${publication.id}`;
  const commitMsg = `chore(release): xuất bản snapshot nội dung studio (${publication.snapshot.sha256.slice(0, 8)})`;

  const token = options.token || env.GITHUB_TOKEN;
  const allowSimulation = Boolean(options.simulateFixture);

  // 1. Khi thiếu GITHUB_TOKEN
  if (!token) {
    if (allowSimulation) {
      const owner = options.repoOwner || env.GITHUB_OWNER || 'tuananh-rd';
      const repo = options.repoName || env.GITHUB_REPO || 'mang-theo-mot-net-ve';
      return {
        success: true,
        isSimulated: true,
        branchName,
        commitSha: `sim-${publication.snapshot.sha256.slice(0, 12)}`,
        prUrl: `https://github.com/${owner}/${repo}/pull/simulated-${publication.id}`,
      };
    }
    return {
      success: false,
      isSimulated: false,
      branchName,
      error: 'not_configured',
      message: 'GitHub credentials (GITHUB_TOKEN) are not configured.',
    };
  }

  // 2. Môi trường Production có GITHUB_TOKEN
  try {
    const owner = options.repoOwner || env.GITHUB_OWNER || 'tuananh-rd';
    const repo = options.repoName || env.GITHUB_REPO || 'mang-theo-mot-net-ve';
    const base = options.baseBranch || env.GITHUB_BASE_BRANCH || 'main';

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'MangTheoMotNetVe-Studio/1.0',
      'Content-Type': 'application/json',
    };

    // Bước 1: Đọc base ref để lấy commit SHA cơ sở
    const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${base}`, { headers });
    if (!refRes.ok) {
      const errText = await refRes.text();
      return {
        success: false,
        isSimulated: false,
        branchName,
        error: `Không thể đọc branch '${base}': ${errText}`,
      };
    }
    const refData = (await refRes.json()) as any;
    const baseCommitSha = refData.object?.sha;

    // Bước 2: Đọc base commit để lấy base tree SHA
    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${baseCommitSha}`, { headers });
    if (!commitRes.ok) {
      const errText = await commitRes.text();
      return {
        success: false,
        isSimulated: false,
        branchName,
        error: `Không thể đọc commit '${baseCommitSha}': ${errText}`,
      };
    }
    const commitData = (await commitRes.json()) as any;
    const baseTreeSha = commitData.tree?.sha;

    // Bước 3: Tạo Git Tree mới chứa các tệp snapshot
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
      ],
    };
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify(treePayload),
    });
    if (!treeRes.ok) {
      const errText = await treeRes.text();
      return {
        success: false,
        isSimulated: false,
        branchName,
        error: `Không thể tạo git tree: ${errText}`,
      };
    }
    const treeData = (await treeRes.json()) as any;
    const newTreeSha = treeData.sha;

    // Bước 4: Tạo Git Commit mới trỏ tới new tree
    const newCommitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
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
        isSimulated: false,
        branchName,
        error: `Không thể tạo git commit: ${errText}`,
      };
    }
    const newCommitData = (await newCommitRes.json()) as any;
    const newCommitSha = newCommitData.sha;

    // Bước 5: Tạo hoặc cập nhật branch ref
    const createRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: newCommitSha,
      }),
    });
    if (!createRefRes.ok) {
      // Nếu branch đã tồn tại, cập nhật ref (không force)
      const patchRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branchName}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ sha: newCommitSha, force: false }),
      });
      if (!patchRefRes.ok) {
        const patchErr = await patchRefRes.text();
        return {
          success: false,
          isSimulated: false,
          branchName,
          error: `Không thể cập nhật branch '${branchName}': ${patchErr}`,
        };
      }
    }

    // Bước 6: Tạo Pull Request (không để lộ email cá nhân)
    const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
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
      if (prErrText.includes('already exists')) {
        const listPrRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?head=${owner}:${branchName}&base=${base}`, { headers });
        if (listPrRes.ok) {
          const prs = (await listPrRes.json()) as any[];
          if (prs.length > 0) {
            return {
              success: true,
              isSimulated: false,
              branchName,
              prUrl: prs[0].html_url,
              commitSha: newCommitSha,
            };
          }
        }
      }
      return {
        success: false,
        isSimulated: false,
        branchName,
        commitSha: newCommitSha,
        error: `GitHub PR error: ${prErrText}`,
      };
    }

    const prData = (await prRes.json()) as any;
    return {
      success: true,
      isSimulated: false,
      branchName,
      prUrl: prData.html_url,
      commitSha: newCommitSha,
    };
  } catch (err: any) {
    return {
      success: false,
      isSimulated: false,
      branchName,
      error: err.message,
    };
  }
}
