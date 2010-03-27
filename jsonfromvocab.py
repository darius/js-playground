"""
Given lines with word/count pairs, write a Javascript object and
the total count.
"""

import sys

total = 0
print 'var vocab = {'
for line in sys.stdin:
    word, nstr = line.split()
    print '"%s":%s,' % (word, nstr)
    total += int(nstr)
print '};'
print 'var NT = %d;' % total
