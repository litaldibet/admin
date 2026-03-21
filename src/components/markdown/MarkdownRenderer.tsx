import ReactMarkdown from "react-markdown"
import rehypeSanitize from "rehype-sanitize"
import remarkGfm from "remark-gfm"
import { transformMarkdownAssetUrl } from "./markdownUrlTransform"

type MarkdownRendererProps = {
  markdown: string
  className?: string
}

export default function MarkdownRenderer({ markdown, className }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      className={className}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      urlTransform={(url, key) => transformMarkdownAssetUrl(url, key)}
      components={{
        img: ({ node, ...props }) => <img loading="lazy" decoding="async" {...props} />
      }}
    >
      {markdown}
    </ReactMarkdown>
  )
}
