"""
Javascript preprocessor

Expand top-level load(...) commands in the way of C's #include.
(But just comment them out when marked with a "//* skip" comment.)
"""

import re
import sys

def expand(file):
    if isinstance(file, (str, unicode)):
        file = open(file)
    write = sys.stdout.write
    for line in file:
        m = re.match(r"\s*load[(]'(.*)'[)]", line)
        if not m:
            sys.stdout.write(line)
        elif re.search(r'//[*] skip', line, re.I):
            write('// ' + line)
        else:
            write('//// ' + line)
            expand(m.group(1))
            write('//// End ' + line)

if __name__ == '__main__':
    if len(sys.argv) == 1:
        expand(sys.stdin)
    else:
        for filename in sys.argv[1:]:
            expand(filename)
