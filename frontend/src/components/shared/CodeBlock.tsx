import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";

export interface CodeBlockProps {
  content: string;
}

export function CodeBlock({ content }: CodeBlockProps) {
  const [copiedStates, setCopiedStates] = useState<{ [key: number]: boolean }>({});

  // Parse content for code blocks
  const parseContent = (text: string) => {
    const parts: Array<{ type: 'text' | 'code', content: string, language?: string }> = [];
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;

    let lastIndex = 0;
    let match;
    let blockIndex = 0;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }

      // Add code block
      parts.push({
        type: 'code',
        content: match[2].trim(),
        language: match[1]
      });

      lastIndex = match.index + match[0].length;
      blockIndex++;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    return parts;
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [index]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [index]: false }));
      }, 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const parts = parseContent(content);

  return (
    <div className="space-y-2">
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <div key={index} className="relative group">
              <div className="bg-gray-50 text-gray-900 p-4 rounded-lg border border-gray-200 font-mono text-sm overflow-x-auto">
                {part.language && (
                  <div className="text-xs text-gray-500 mb-2 pb-2 border-b border-gray-200">
                    {part.language}
                  </div>
                )}
                <pre className="whitespace-pre-wrap wrap-break-word">
                  <code>{part.content}</code>
                </pre>
              </div>
              <Button
                size="icon-xs"
                variant="ghost"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 hover:bg-gray-50 text-gray-900 hover:text-gray-800"
                onClick={() => copyToClipboard(part.content, index)}
              >
                {copiedStates[index] ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          );
        }

        return (
          <p key={index} className="text-sm text-muted-foreground whitespace-pre-wrap">
            {part.content}
          </p>
        );
      })}
    </div>
  );
}
