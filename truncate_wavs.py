#!/usr/bin/env python
# Take the wavs from shishkabob, trim them to 10s and convert them to mp3.
import commands
import contextlib
import os
import sys
import wave

DURATION = 2000

def main():
  if len(sys.argv) < 2:
    print 'usage: %s path/to/wavs' % sys.argv[0]
    sys.exit(1)

  src = sys.argv[1]
  dst = 'snd'

  convert_and_chunk(src, dst, 20)


def convert_and_trim(src, dst, duration):
  for wav in os.listdir(src):
    wav_path = os.path.join(src, wav)
    mp3_path = os.path.join(dst, wav.replace('wav', 'mp3'))
    print wav_path, mp3_path
    os.system('sox "%s" "%s" trim 0 %d remix 1,2' % (wav_path, mp3_path, duration))

def convert_and_chunk(src, dst, chunk_duration):
  for wav in os.listdir(src):
    wav_path = os.path.join(src, wav)
    dir_path = os.path.join(dst, 'chunks', os.path.splitext(os.path.basename(wav))[0])
    print wav_path, dir_path
    break_into_chunks(wav_path, dir_path, chunk_duration)


def break_into_chunks(wav_path, dst_dir_path, chunk_duration):
  if not os.path.exists(dst_dir_path):
    os.makedirs(dst_dir_path)

  duration = get_wav_duration(wav_path)
  chunks = int(duration / chunk_duration) + 1
  print duration, chunks
  for index in range(chunks):
    basename = os.path.basename(wav_path)
    mp3_name = '%s-%d.mp3' % (os.path.splitext(basename)[0], index)
    mp3_path = os.path.join(dst_dir_path, mp3_name)
    base = 'sox "%s" "%s"' % (wav_path, mp3_path)
    start = index * chunk_duration
    trim = 'trim %f %f' % (start, chunk_duration)
    remix = 'remix 1,2'
    command = ' '.join([base, trim, remix])
    print command
    os.system(command)

def get_wav_duration(wav_path):
  command = 'sox "%s" -n stat' % wav_path
  status, output = commands.getstatusoutput(command)
  lines = output.split('\n')
  header = 'Length (seconds):'
  for line in lines:
    if line.startswith(header):
      data = line[len(header):]
      duration = float(data.strip())
      return duration
  return -1

if __name__ == '__main__':
  main()
