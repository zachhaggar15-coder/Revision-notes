import { isValidElement } from "react";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownViewerProps = {
  content: string;
};

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="prose-course">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, href }) => (
            <a
              className="font-medium text-[#0d7c66] underline decoration-[#9ed8c8] underline-offset-4"
              href={getSafeHref(href)}
              rel="noreferrer"
              target={getSafeHref(href) ? "_blank" : undefined}
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-5 rounded-lg border border-[#cce7dc] bg-[#eff8f4] px-5 py-4 text-[#28483f] shadow-sm">
              {children}
            </blockquote>
          ),
          h2: ({ children }) => (
            <h2 className="mt-8 border-b border-[#e7dfd3] pb-3 text-2xl font-semibold text-[#171713]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-6 text-lg font-semibold text-[#171713]">{children}</h3>
          ),
          p: ({ children }) => {
            const text = nodeToText(children).trim().toLowerCase();

            if (text.startsWith("definition:")) {
              return (
                <p className="my-4 rounded-lg border border-[#d8e9e0] bg-[#f3fbf7] px-4 py-3 text-sm leading-7 text-[#24483f]">
                  <span className="mr-2 rounded-md bg-white px-2 py-1 text-xs font-semibold uppercase text-[#176b58]">
                    Definition
                  </span>
                  {stripLeadLabel(children, "Definition:")}
                </p>
              );
            }

            if (text.startsWith("important:") || text.startsWith("key concept:")) {
              return (
                <p className="my-4 rounded-lg border border-[#eadab6] bg-[#fff8e9] px-4 py-3 text-sm leading-7 text-[#634b18]">
                  <span className="mr-2 rounded-md bg-white px-2 py-1 text-xs font-semibold uppercase text-[#7a5b12]">
                    Important
                  </span>
                  {stripLeadLabel(children, text.startsWith("key concept:") ? "Key concept:" : "Important:")}
                </p>
              );
            }

            return <p>{children}</p>;
          },
          table: ({ children }) => (
            <div className="my-5 overflow-x-auto rounded-lg border border-[#e5ded2] bg-white shadow-sm">
              <table>{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-[#f3efe7] px-4 py-3 text-left text-sm font-semibold text-[#171713]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm leading-6 text-[#34322d]">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function nodeToText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(nodeToText).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return nodeToText(node.props.children);
  }

  return "";
}

function stripLeadLabel(children: ReactNode, label: string): ReactNode {
  const childArray = Array.isArray(children) ? children : [children];
  let stripped = false;

  return childArray.map((child, index) => {
    if (!stripped && typeof child === "string") {
      stripped = true;
      return child.replace(new RegExp(`^${escapeRegExp(label)}\\s*`, "i"), "");
    }

    return <span key={index}>{child}</span>;
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSafeHref(href?: string) {
  if (!href) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(href, "https://coursemind.local");
    if (["http:", "https:", "mailto:"].includes(parsedUrl.protocol)) {
      return href;
    }
  } catch {
    return undefined;
  }

  return undefined;
}
