import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

type MdxComponentMap = Parameters<typeof compileMDX>[0]["components"];

const mdxComponents: MdxComponentMap = {
  h1: (props) => (
    <h1 className="font-heading text-[1.9rem] font-extrabold tracking-tight sm:text-[2.25rem]" {...props} />
  ),
  h2: (props) => (
    <h2 className="mt-8 font-heading text-[1.45rem] font-extrabold tracking-tight sm:text-[1.75rem]" {...props} />
  ),
  h3: (props) => (
    <h3 className="mt-6 font-heading text-[1.18rem] font-extrabold tracking-tight sm:text-[1.3rem]" {...props} />
  ),
  p: (props) => <p className="mt-3.5 text-[15px] leading-7 text-muted sm:text-base sm:leading-8" {...props} />,
  ul: (props) => <ul className="mt-3.5 list-disc space-y-2 pl-5 sm:pl-6" {...props} />,
  ol: (props) => <ol className="mt-3.5 list-decimal space-y-2 pl-5 sm:pl-6" {...props} />,
  li: (props) => <li className="text-[15px] leading-7 text-muted sm:text-base sm:leading-8" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="mt-5 rounded-[0.9rem] border border-outline-variant/80 bg-surface-low/80 px-4 py-3.5 text-[15px] leading-7 text-muted sm:text-base sm:leading-8"
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
