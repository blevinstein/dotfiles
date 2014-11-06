#!/usr/bin/env python

import sys
import subprocess

#diffprog = 'diff'
diffprog = 'vimdiff'

def main():
  # check command-line arguments
  if len(sys.argv) < 2:
    sys.exit(1)

  # read input from file
  with open(sys.argv[1]) as f:
    whole_file = f.read()
  expected, actual = whole_file.split(" but was:")

  # sanitize and sanity-check input
  expected = clean(expected)
  actual = clean(actual)

  # write output to temp files
  with open(sys.argv[1] + '.expected', 'w') as f:
    f.write(expected)
  with open(sys.argv[1] + '.actual', 'w') as f:
    f.write(actual)

  # show diff
  subprocess.call([diffprog, sys.argv[1] + '.expected', sys.argv[1] + '.actual'])

def clean(s):
  s = s.strip()
  assert(s.startswith('<'))
  assert(s.endswith('>'))
  return s

if __name__ == '__main__':
  main()
