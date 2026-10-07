import 'dart:async';

import 'package:audio_service/audio_service.dart';
import 'package:flutter/foundation.dart';
import 'package:just_audio/just_audio.dart';

class EmmanuelAudioHandler extends BaseAudioHandler
    with QueueHandler, SeekHandler {
  EmmanuelAudioHandler() {
    _player.playbackEventStream.listen(
      _broadcastState,
      onError: (Object error, StackTrace stackTrace) {
        onUpdate?.call({
          'playing': false,
          'status': 'Erreur audio : $error',
        });
      },
    );
    _player.currentIndexStream.listen((index) {
      final items = queue.value;
      final item = index != null && index >= 0 && index < items.length
          ? items[index]
          : null;
      mediaItem.add(item);
      _notifyPage();
    });
    _player.playerStateStream.listen((_) => _notifyPage());
  }

  final AudioPlayer _player = AudioPlayer();
  ValueChanged<Map<String, Object?>>? onUpdate;

  Map<String, Object?> get currentPageState => _pageState;

  Map<String, Object?> get _pageState {
    final index = _player.currentIndex;
    final items = queue.value;
    final item = index != null && index >= 0 && index < items.length
        ? items[index]
        : null;
    return {
      'playing': _player.playing,
      if (item != null)
        'track': {
          'id': item.extras?['messageId'] ?? '',
          'title': item.title,
          'part': item.extras?['part'] ?? 1,
          'date': item.extras?['date'] ?? '',
        },
      if (_player.processingState == ProcessingState.completed)
        'status': 'Lecture terminée.',
      if (_player.processingState == ProcessingState.completed) 'ended': true,
    };
  }

  Future<void> playTracks(List<dynamic> tracks) async {
    final items = <MediaItem>[];
    for (final value in tracks) {
      if (value is! Map) continue;
      final source = value['source'];
      final id = value['id'];
      if (source is! String || id is! String) continue;
      final uri = Uri.tryParse(source);
      if (uri == null || uri.scheme != 'https') continue;
      items.add(
        MediaItem(
          id: source,
          title:
              value['title'] is String ? value['title'] as String : 'Message',
          artist: 'EMMANUEL · ID $id',
          album: 'Messages EMMANUEL',
          extras: {
            'messageId': id,
            'part': value['part'] == 2 ? 2 : 1,
            'date': value['date'] is String ? value['date'] as String : '',
          },
        ),
      );
    }

    if (items.isEmpty) {
      onUpdate?.call({
        'playing': false,
        'status': 'Aucun message avec une piste audio disponible.',
      });
      return;
    }

    await _player.stop();
    queue.add(items);
    final source = ConcatenatingAudioSource(
      useLazyPreparation: true,
      children: items
          .map(
            (item) => AudioSource.uri(
              Uri.parse(item.id),
              tag: item,
            ),
          )
          .toList(),
    );
    await _player.setAudioSource(source, initialIndex: 0);
    await _player.setLoopMode(LoopMode.off);
    await _player.setShuffleModeEnabled(false);
    await play();
  }

  @override
  Future<void> play() => _player.play();

  @override
  Future<void> pause() => _player.pause();

  @override
  Future<void> seek(Duration position) => _player.seek(position);

  @override
  Future<void> skipToNext() async {
    if (_player.hasNext) await _player.seekToNext();
  }

  @override
  Future<void> skipToPrevious() async {
    if (_player.hasPrevious) {
      await _player.seekToPrevious();
    } else {
      await _player.seek(Duration.zero);
    }
  }

  @override
  Future<void> stop() async {
    await _player.stop();
    queue.add(const []);
    mediaItem.add(null);
    await super.stop();
    onUpdate?.call({'playing': false, 'status': 'Lecture arrêtée.'});
  }

  void _broadcastState(PlaybackEvent event) {
    const processingStates = {
      ProcessingState.idle: AudioProcessingState.idle,
      ProcessingState.loading: AudioProcessingState.loading,
      ProcessingState.buffering: AudioProcessingState.buffering,
      ProcessingState.ready: AudioProcessingState.ready,
      ProcessingState.completed: AudioProcessingState.completed,
    };
    final playing = _player.playing;
    playbackState.add(
      PlaybackState(
        controls: [
          MediaControl.skipToPrevious,
          playing ? MediaControl.pause : MediaControl.play,
          MediaControl.stop,
          MediaControl.skipToNext,
        ],
        systemActions: const {MediaAction.seek},
        androidCompactActionIndices: const [0, 1, 2],
        processingState: processingStates[_player.processingState]!,
        playing: playing,
        updatePosition: _player.position,
        bufferedPosition: _player.bufferedPosition,
        speed: _player.speed,
        queueIndex: event.currentIndex,
      ),
    );
    _notifyPage();
  }

  void _notifyPage() {
    onUpdate?.call(_pageState);
  }
}
