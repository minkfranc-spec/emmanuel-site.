import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

const _gold = Color(0xFFD4AF37);
final _publicSiteUri = Uri.parse('https://emmanuel-dpv.pages.dev/');

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Color(0xFF090F1B),
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xFF090F1B),
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  runApp(const EmmanuelManagementApp());
}

class EmmanuelManagementApp extends StatelessWidget {
  const EmmanuelManagementApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gestion EMMANUEL',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: _gold),
        useMaterial3: true,
      ),
      home: const ManagementPage(),
    );
  }
}

class ManagementPage extends StatefulWidget {
  const ManagementPage({super.key});

  @override
  State<ManagementPage> createState() => _ManagementPageState();
}

class _ManagementPageState extends State<ManagementPage> {
  late final WebViewController _controller;
  bool _isLoading = true;
  int _progress = 0;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF090F1B))
      ..addJavaScriptChannel(
        'PublicSiteOpener',
        onMessageReceived: (_) => unawaited(_openPublicSite()),
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (progress) {
            if (mounted) setState(() => _progress = progress);
          },
          onPageStarted: (_) {
            if (mounted) setState(() => _isLoading = true);
          },
          onPageFinished: (_) {
            if (mounted) {
              setState(() {
                _isLoading = false;
                _progress = 100;
              });
            }
          },
          onWebResourceError: (error) {
            if ((error.isForMainFrame ?? true) && mounted) {
              setState(() => _isLoading = false);
              _showError('Impossible de charger la page de gestion intégrée.');
            }
          },
          onNavigationRequest: _handleNavigationRequest,
        ),
      );
    unawaited(_controller.loadFlutterAsset('assets/gestion-franc.html'));
  }

  Future<NavigationDecision> _handleNavigationRequest(
    NavigationRequest request,
  ) async {
    final uri = Uri.tryParse(request.url);
    if (uri == null) return NavigationDecision.prevent;

    if (uri.scheme == 'file' ||
        uri.scheme == 'about' ||
        uri.scheme == 'javascript' ||
        uri.scheme == 'data' ||
        uri.scheme == 'blob') {
      return NavigationDecision.navigate;
    }

    if (uri.scheme == 'https' ||
        uri.scheme == 'http' ||
        uri.scheme == 'mailto' ||
        uri.scheme == 'tel' ||
        uri.scheme == 'sms') {
      await _openExternal(uri);
    }
    return NavigationDecision.prevent;
  }

  Future<void> _openPublicSite() => _openExternal(_publicSiteUri);

  Future<void> _openExternal(Uri uri) async {
    try {
      final opened = await launchUrl(
        uri,
        mode: LaunchMode.externalApplication,
      );
      if (!opened) _showError('Impossible d’ouvrir ce lien sur cet appareil.');
    } on PlatformException {
      _showError('Impossible d’ouvrir ce lien sur cet appareil.');
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF090F1B),
      body: SafeArea(
        child: Stack(
          children: [
            WebViewWidget(controller: _controller),
            if (_isLoading)
              Align(
                alignment: Alignment.topCenter,
                child: LinearProgressIndicator(
                  value: _progress == 0 ? null : _progress / 100,
                  color: _gold,
                  backgroundColor: const Color(0xFF111B2B),
                  minHeight: 3,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
