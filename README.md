# Virtual Scrolling Tree

[![Build Status](https://travis-ci.org/PepsRyuu/virtual-scrolling-tree.svg?branch=master)](https://travis-ci.org/PepsRyuu/virtual-scrolling-tree)

Virtual scrolling tables are an easy problem to solve. If you know how many rows there are in a table, you can easily map the scrollbar position to a row index and slice the data of the table to show that index. For trees however, it's a significantly more complicated problem. With trees, you have items that can expand and change the total scroll height, and the parent for an item isn't necessarily visible as you're scrolling. 

This project demonstrates how to implement a tree which adopts the virtual scrolling technique.

[Live Demo](http://pepsryuu.github.io/demo/vst/)