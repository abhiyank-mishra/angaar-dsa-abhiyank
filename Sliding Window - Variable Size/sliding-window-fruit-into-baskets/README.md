# Sliding Window: Fruit Into Baskets

**Difficulty:** `Medium`  

**Sheet:** Sliding Window | Variable Size  

**Language:** java  

**Platform:** [The Angaar Batch](https://theangaarbatch.in/contests/super-150-contest-1/solve/sliding-window-fruit-into-baskets)  

## Problem Description

You are given an integer array 'fruits' where fruits[i] is the type of fruit the i-th tree produces.

You have only 2 baskets, and each basket can only hold a single type of fruit. There is no limit on the amount of fruit each basket can hold.

Starting from any tree of your choice, you must collect exactly one fruit from every tree (including the start tree) while moving to the right. Once you reach a tree with fruit that cannot fit into your baskets, you must stop.

Return the maximum number of fruits you can pick.

### Input Format
The platform provides T test cases.
For each testcase:
First line contains N (number of trees).
Second line contains N space-separated integers representing the fruit types.


### Output Format
For each testcase, print the maximum number of fruits that can be collected.


### Constraints
1 <= fruits.length <= 10^5
0 <= fruits[i] < fruits.length


---

*Auto-synced via [Angaar Toolkit Pro](https://github.com/abhiyank-mishra/angaar-dsa-abhiyank)*