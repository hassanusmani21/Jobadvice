const adsensePublisherId = "ca-pub-9949097899491859";

export default function AdSenseSiteScript() {
  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisherId}`}
      crossOrigin="anonymous"
      data-ad-client={adsensePublisherId}
    />
  );
}
