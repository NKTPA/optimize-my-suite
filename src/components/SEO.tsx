import { Helmet } from "react-helmet-async";

const SITE_URL = "https://optimizemysuite.com";

interface SEOProps {
  title: string;
  description: string;
  canonicalPath: string;
}

export function SEO({ title, description, canonicalPath }: SEOProps) {
  const url = SITE_URL + canonicalPath;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
    </Helmet>
  );
}

export default SEO;