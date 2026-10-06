const siteUrl = 'https://emmanuel-dpv.pages.dev';
const siteHost = 'emmanuel-dpv.pages.dev';

bool shouldKeepInWebView(Uri uri) {
  if (uri.host == siteHost &&
      (uri.scheme == 'https' || uri.scheme == 'http')) {
    return true;
  }

  return const {'javascript', 'about', 'data', 'blob'}.contains(uri.scheme);
}
