import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import 'navigation_policy.dart';

const _gold = Color(0xFFD4AF37);

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: _gold,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );
  runApp(const EmmanuelApp());
}

class EmmanuelApp extends StatelessWidget {
  const EmmanuelApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EMMANUEL',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: _gold),
        useMaterial3: true,
      ),
      home: const SitePage(),
    );
  }
}

class SitePage extends StatefulWidget {
  const SitePage({super.key});

  @override
  State<SitePage> createState() => _SitePageState();
}

class _SitePageState extends State<SitePage> {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _hasError = false;
  bool _canGoBack = false;
  int _progress = 0;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFFDFDFD))
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (progress) {
            if (mounted) setState(() => _progress = progress);
          },
          onPageStarted: (_) {
            if (mounted) {
              setState(() {
                _isLoading = true;
                _hasError = false;
                _progress = 0;
              });
            }
          },
          onPageFinished: (_) {
            if (mounted) {
              setState(() {
                _isLoading = false;
                _hasError = false;
                _progress = 100;
              });
              unawaited(_updateCanGoBack());
            }
          },
          onWebResourceError: (error) {
            if (error.isForMainFrame ?? true) {
              if (mounted) {
                setState(() {
                  _isLoading = false;
                  _hasError = true;
                });
              }
            }
          },
          onNavigationRequest: _handleNavigationRequest,
        ),
      );
    unawaited(_controller.loadRequest(Uri.parse(siteUrl)));
  }

  Future<NavigationDecision> _handleNavigationRequest(
    NavigationRequest request,
  ) async {
    final uri = Uri.tryParse(request.url);
    if (uri == null) return NavigationDecision.prevent;

    if (shouldKeepInWebView(uri)) {
      return NavigationDecision.navigate;
    }

    if (uri.scheme == 'https' ||
        uri.scheme == 'http' ||
        uri.scheme == 'mailto' ||
        uri.scheme == 'tel' ||
        uri.scheme == 'sms') {
      try {
        final opened = await launchUrl(
          uri,
          mode: LaunchMode.externalApplication,
        );
        if (!opened) _showLinkError();
      } on PlatformException {
        _showLinkError();
      }
    }

    return NavigationDecision.prevent;
  }

  Future<void> _updateCanGoBack() async {
    final canGoBack = await _controller.canGoBack();
    if (mounted) setState(() => _canGoBack = canGoBack);
  }

  Future<void> _goBack() async {
    if (await _controller.canGoBack()) {
      await _controller.goBack();
    }
  }

  void _showLinkError() {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Impossible d’ouvrir ce lien.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !_canGoBack,
      onPopInvoked: (didPop) {
        if (!didPop) unawaited(_goBack());
      },
      child: Scaffold(
        body: SafeArea(
          child: Stack(
            children: [
              if (_hasError)
                _OfflinePage(onRetry: () {
                  setState(() {
                    _hasError = false;
                    _isLoading = true;
                  });
                  unawaited(_controller.reload());
                })
              else
                WebViewWidget(controller: _controller),
              if (_isLoading && !_hasError)
                Align(
                  alignment: Alignment.topCenter,
                  child: LinearProgressIndicator(
                    value: _progress == 0 ? null : _progress / 100,
                    color: _gold,
                    backgroundColor: Colors.white,
                    minHeight: 3,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OfflinePage extends StatelessWidget {
  const _OfflinePage({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.wifi_off_rounded, color: _gold, size: 56),
            const SizedBox(height: 20),
            Text(
              'Connexion indisponible',
              style: Theme.of(context).textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            const Text(
              'Vérifiez votre connexion Internet et réessayez.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: onRetry,
              child: const Text('Réessayer'),
            ),
          ],
        ),
      ),
    );
  }
}
