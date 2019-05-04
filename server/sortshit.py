import numpy as np
file = open("words.txt", 'r')
lines = file.readlines()
np.random.shuffle(lines)
file.close()
print (len(lines))
file = open("sortedwords.txt", 'w')
for word in lines:
	file.write(word)
file.close()