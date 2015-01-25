#!/usr/bin/env python
# Take the wavs from shishkabob, trim them to 10s and convert them to mp3.
import os

src = 'shishkabob'
dst = 'snd'
for wav in os.listdir(src):
  wav_path = os.path.join(src, wav)
  mp3_path = os.path.join(dst, wav.replace('wav', 'mp3'))
  print wav_path, mp3_path
  os.system('sox "%s" "%s" trim 30 30 remix 1,2' % (wav_path, mp3_path))
