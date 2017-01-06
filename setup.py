import os
import os.path
import shutil
import sys

def do(command):
  if os.system(command) > 0:
    print('"%s" failed' % command)
    sys.exit()

def delete(obj):
  if os.path.isfile(obj):
    os.remove(obj)
  elif os.path.isdir(obj):
    shutil.rmtree(obj)

def copy(source, dest):
  if os.path.isfile(source):
    shutil.copy(source, dest)
  elif os.path.isdir(source):
    shutil.copytree(source, dest)

def main():
  source = os.curdir
  dest = os.environ['HOME']
  do('git submodule init')
  do('git submodule update')
  for x in os.listdir(source):
    source_x = os.path.join(source, x)
    dest_x = os.path.join(dest, x)
    if os.path.exists(dest_x):
      print('Removing %s' % dest_x)
      delete(dest_x)
    print('Copying %s -> %s' % (source_x, dest_x))
    copy(source_x, dest_x)

if __name__ == '__main__':
  main()
