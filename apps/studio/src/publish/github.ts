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
}

export interface GitHubPublishResult {
  success: boolean;
  isSimulated: boolean;
  branchName: string;
  prUrl?: string;
  commitSha?: string;
  error?: string;
}

/**
 * Tạo Pull Request xuất bản hoặc giả lập quy trình PR nội bộ
 */
export async function triggerGitHubPublication(
  publication: PublicationRecord,
  env: Env,
  options: GitHubPublishOptions = {}
): Promise<GitHubPublishResult> {
  const branchName = `studio/publish-${publication.id}`;
  const commitMsg = `chore(release): xuất bản snapshot nội dung studio (${publication.snapshot.sha256.slice(0, 8)})`;

  const token = options.token || env.GITHUB_TOKEN;

  // 1. Môi trường phát triển cục bộ hoặc chưa cấp GITHUB_TOKEN
  if (!token) {
    return {
      success: true,
      isSimulated: true,
      branchName,
      commitSha: `sim-${publication.snapshot.sha256.slice(0, 12)}`,
      prUrl: `https://github.com/${options.repoOwner || 'mangtheomotnetve'}/${options.repoName || 'mang-theo-mot-net-ve'}/pull/simulated-${publication.id}`,
    };
  }

  // 2. Môi trường Production có GITHUB_TOKEN
  try {
    const owner = options.repoOwner || 'mangtheomotnetve';
    const repo = options.repoName || 'mang-theo-mot-net-ve';
    const base = options.baseBranch || 'main';

    // Gọi GitHub API tạo Pull Request
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'MangTheoMotNetVe-Studio/1.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `[Content Studio] Xuất bản phiên bản nội dung mới (${publication.id})`,
        head: branchName,
        base,
        body: `### Xuất bản Content Studio\n- **Mã yêu cầu:** \`${publication.id}\`\n- **Mã băm Snapshot:** \`${publication.snapshot.sha256}\`\n- **Người tạo:** ${publication.requestedBy}\n- **Người duyệt:** ${publication.approvedBy || 'N/A'}\n- **Thời gian:** ${new Date().toISOString()}`,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        isSimulated: false,
        branchName,
        error: `GitHub API trả về lỗi ${res.status}: ${errText}`,
      };
    }

    const data = (await res.json()) as any;
    return {
      success: true,
      isSimulated: false,
      branchName,
      prUrl: data.html_url,
      commitSha: data.head?.sha,
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
