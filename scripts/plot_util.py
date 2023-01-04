import math
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

def countlist(l):
    counts = dict()
    for i in l:
        counts[i] = counts.get(i, 0) + 1
    return counts

def avg_col(file_url, col):
    xl = pd.ExcelFile(file_url)
    temp_col = getcol_full(xl, col)
    col_list = []
    for i in temp_col:
        if not math.isnan(i):
            col_list.append(float(i))
    return sum(col_list) / len(col_list)

def get_sheetnames(file_url):
    xl = pd.ExcelFile(file_url)
    return xl.sheet_names

def get_sheet(file_url, n):
    xl = pd.ExcelFile(file_url)
    return xl.parse(xl.sheet_names[n])

#use to get a list of all the values in a columns across ALL sheets
def getcol_full(file_url, c):
    xl = pd.ExcelFile(file_url)
    clist = []
    for s in xl.sheet_names:
        try:
            clist.extend(xl.parse(s)[c])
        except Exception as e:
            print(e)
    return clist

#use to get a list of all the values in a column from a single (n) sheet
def getcol(file_url, c, n):
    xl = pd.ExcelFile(file_url)
    try:
        clist = get_sheet(xl, n)[c]
    except Exception as e:
        print(e)
    return clist

def graph_cols(file_url, c1, c2):
    xl = pd.ExcelFile(file_url)
    x = np.array(getcol_full(xl, c1))
    y = np.array(getcol_full(xl, c2))
    fig, ax = plt.subplots()
    ax.set_title(c1 + " vs " + c2)
    plt.scatter(x, y)
    plt.show()
    
def piegraph(counts, title):
    fig, ax = plt.subplots()
    ax.set_title(title)
    cs = list(counts.values())
    labels = list(counts.keys())
    plt.pie(cs, labels=labels)
    plt.show()    

def bar_dict(dic, title):
    fig, ax = plt.subplots()
    ax.set_title(title)
    plt.bar(*zip(*dic.items()))
    plt.show()
