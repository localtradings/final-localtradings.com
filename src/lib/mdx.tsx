import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

type MdxComponentMap = Parameters<typeof compileMDX>[0]["components"];

const mdxComponents: MdxComponentMap = {
  h1: (props) => (
    <h1 className="font-heading text-4xl font-extrabold tracking-tight" {...props} />
  ),
  h2: (props) => (
    <h2 className="mt-10 font-heading text-3xl font-extrabold tracking-tight" {...props} />
  ),
  h3: (props) => (
    <h3 className="mt-8 font-heading text-2xl font-extrabold tracking-tight" {...props} />
  ),
  p: (props) => <p className="mt-4 text-base leading-8 text-muted" {...props} />,
  ul: (props) => <ul className="mt-4 list-disc space-y-3 pl-6" {...props} />,
  ol: (props) => <ol className="mt-4 list-decimal space-y-3 pl-6" {...props} />,
  li: (props) => <li className="text-base leading-8 text-muted" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="mt-6 border-l-4 border-primary/40 pl-4 text-base italic text-muted"
      {...props}
    />
  ),
  strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
};

export async function renderMdx(source: string) {
  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
      },
    },
  });

  return content;
}
