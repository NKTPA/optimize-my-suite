import { Helmet } from "react-helmet-async";

const SITE_URL = "https://optimizemysuite.com";

interface SEOProps {
  title: string;
  description: string;
  canonicalPath: string;
  schema?: Record<string, unknown>;
}

export function SEO({ title, description, canonicalPath, schema }: SEOProps) {
  const url = SITE_URL + canonicalPath;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {schema && (
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      )}
    </Helmet>
  );
}

export default SEO;