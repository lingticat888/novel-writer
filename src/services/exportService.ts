import type { Novel } from '@/models';

export interface ExportOptions {
  format: 'markdown' | 'json';
  includeMetadata?: boolean;
}

export class ExportService {
  exportToMarkdown(novel: Novel): string {
    const lines: string[] = [];

    lines.push(`# ${novel.title}`);
    lines.push('');

    if (novel.description) {
      lines.push(`> ${novel.description}`);
      lines.push('');
    }

    lines.push(`---`);
    lines.push('');

    const volumes = novel.volumes || [];
    volumes.forEach((volume, volIndex) => {
      lines.push(`## ${volume.title}`);
      lines.push('');

      const chapters = volume.chapters || [];
      chapters.forEach((chapter, chapIndex) => {
        lines.push(`### ${chapter.title}`);
        lines.push('');

        const content = this.stripHtml(chapter.content);
        if (content) {
          lines.push(content);
        } else {
          lines.push('（此章节暂无内容）');
        }
        lines.push('');

        if (chapIndex < chapters.length - 1) {
          lines.push('---');
          lines.push('');
        }
      });

      if (volIndex < volumes.length - 1) {
        lines.push('***');
        lines.push('');
      }
    });

    lines.push('---');
    lines.push(`*导出时间: ${new Date().toLocaleString('zh-CN')}*`);

    return lines.join('\n');
  }

  exportToJson(novel: Novel, includeMetadata = true): string {
    const exportData = {
      ...(includeMetadata ? {
        exportedAt: new Date().toISOString(),
        version: '1.0',
      } : {}),
      novel: {
        id: novel.id,
        title: novel.title,
        description: novel.description,
        createdAt: novel.createdAt,
        updatedAt: novel.updatedAt,
        volumes: novel.volumes?.map(volume => ({
          id: volume.id,
          title: volume.title,
          order: volume.order,
          chapters: volume.chapters?.map(chapter => ({
            id: chapter.id,
            title: chapter.title,
            content: chapter.content,
            contentPlainText: this.stripHtml(chapter.content),
            wordCount: chapter.wordCount,
            order: chapter.order,
          })),
        })),
        characters: novel.characters,
      },
    };

    return JSON.stringify(exportData, null, 2);
  }

  downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  exportNovel(novel: Novel, options: ExportOptions): void {
    const { format } = options;
    const timestamp = new Date().toISOString().slice(0, 10);
    const safeTitle = novel.title.replace(/[<>:"/\\|?*]/g, '');

    if (format === 'markdown') {
      const content = this.exportToMarkdown(novel);
      this.downloadFile(content, `${safeTitle}_${timestamp}.md`, 'text/markdown;charset=utf-8');
    } else {
      const content = this.exportToJson(novel);
      this.downloadFile(content, `${safeTitle}_${timestamp}.json`, 'application/json');
    }
  }

  private stripHtml(html: string): string {
    if (!html) return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

export const exportService = new ExportService();
