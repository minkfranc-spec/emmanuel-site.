import 'package:flutter_test/flutter_test.dart';
import 'package:emmanuel_app/navigation_policy.dart';

void main() {
  group('shouldKeepInWebView', () {
    test('keeps pages on the site in the WebView', () {
      expect(
        shouldKeepInWebView(Uri.parse('$siteUrl/messages')),
        isTrue,
      );
    });

    test('does not keep external sites or phone links in the WebView', () {
      expect(
        shouldKeepInWebView(Uri.parse('https://example.com')),
        isFalse,
      );
      expect(
        shouldKeepInWebView(Uri.parse('tel:+237678356844')),
        isFalse,
      );
    });

    test('keeps JavaScript links inside the page', () {
      expect(
        shouldKeepInWebView(Uri.parse('javascript:void(0)')),
        isTrue,
      );
    });
  });
}
