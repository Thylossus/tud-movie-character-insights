#!/usr/bin/python3
# -*- coding: UTF-8 -*-
import json
import sys

# This script shows a histogram created by evaluationTime.py using the matplotlib library
# The csv file with the values has to be passed as a parameter.

# Include custom libs
sys.path.append( '../../../include/python' )

import serverutils.config as config
import matplotlib.pyplot as plt

data = []
labels = []
maxAmount = 0
maxTime = 0
for d in open(sys.argv[1],'r'):
	lbl,amount = d.split(";",2)
	maxTime = max(maxTime, int(lbl))
	maxAmount = max(maxAmount, int(amount))
	data += [int(amount)]
	labels += [int(lbl)]

plt.bar(labels,data,labels[1]*0.75)
plt.xlabel('Time')
plt.ylabel('Amount')
plt.title('Histogram')
plt.axis([0, maxTime, 0, int(maxAmount*1.2)])
plt.grid(True)
plt.show()
