import sys
print "Hello World"

# check arguments
args = sys.argv
print "Number of arguments: %d" % len(args)
print "Arguments: %s" % " ".join(args)

# take input
i = 0
while i < 10:
    print "Type something (%d): " % i
    line = sys.stdin.readline()
    print "Reply: %s" % line
    i += 1
