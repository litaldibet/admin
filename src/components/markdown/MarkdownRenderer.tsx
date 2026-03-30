import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import remarkGfm from "remark-gfm"
import { transformMarkdownAssetUrl } from "./markdownUrlTransform"

type MarkdownRendererProps = {
  markdown: string
  className?: string
}

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "div"],
  attributes: {
    ...(defaultSchema.attributes ?? {}),
    div: [["align", "center"]]
  }
}

export default function MarkdownRenderer({ markdown, className }: MarkdownRendererProps) {

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeRaw], [rehypeSanitize, sanitizeSchema]]}
        urlTransform={(url, key) => transformMarkdownAssetUrl(url, key)}
        components={{
          img: (props) => <img loading="lazy" decoding="async" {...props} />
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
