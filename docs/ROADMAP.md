# DSA Interview Mastery Plan — 20-Week Roadmap

This document is the **curriculum source of truth** for DSA Quest. The platform's
Course → Phase → Week → Chapter → Lesson hierarchy is generated from this file.

Every week follows the same chapter rhythm:

1. **Introduction** — theory, visualizations, quiz
2. **Core Pattern A** — guided examples + practice
3. **Core Pattern B** — guided examples + practice
4. **Advanced Applications** — harder problems + revision

Every chapter contains lessons of five types: Theory → Guided Example → Quiz →
Practice Problems → Revision.

---

## Phase 1 — Linear Patterns (Weeks 1–4)

*Goal: master contiguous-structure thinking — the patterns behind ~40% of all interview questions.*

### Week 1 — Arrays, Strings & Complexity
| Chapter | Focus |
|---|---|
| 1. How to Measure Code | Big-O, time vs space, amortized analysis |
| 2. Array Mechanics | traversal, in-place mutation, swaps, rotation |
| 3. String Mechanics | immutability, building, frequency counting |
| 4. Advanced Applications | rotate array, product except self, string compression |

Key problems: Two Sum, Best Time to Buy/Sell Stock, Valid Anagram, Rotate Array, Product of Array Except Self.

### Week 2 — Two Pointers
| Chapter | Focus |
|---|---|
| 1. Introduction | why two pointers beat nested loops |
| 2. Opposite Ends | converging pointers on sorted data |
| 3. Same Direction | slow/fast, partitioning, dedup |
| 4. Advanced Applications | 3Sum, container with most water, trapping rain water |

Key problems: Valid Palindrome, Two Sum II, 3Sum, Container With Most Water, Move Zeroes, Trapping Rain Water.

### Week 3 — Sliding Window
| Chapter | Focus |
|---|---|
| 1. Introduction | window as a reusable computation |
| 2. Fixed Window | max sum subarray of size k, averages |
| 3. Variable Window | grow/shrink, longest substring patterns |
| 4. Advanced Applications | minimum window substring, sliding window maximum |

Key problems: Max Sum Subarray Size K, Longest Substring Without Repeating Characters, Permutation in String, Minimum Window Substring, Sliding Window Maximum.

### Week 4 — Hashing & Prefix Sums
| Chapter | Focus |
|---|---|
| 1. Introduction | O(1) lookup as a superpower; hash maps vs sets |
| 2. Frequency & Grouping | counting, anagram groups, top-k frequent |
| 3. Prefix Sums | running totals, range queries, sum-to-k |
| 4. Advanced Applications | subarray sum equals k, longest consecutive sequence |

Key problems: Group Anagrams, Top K Frequent Elements, Subarray Sum Equals K, Longest Consecutive Sequence, Range Sum Query.

---

## Phase 2 — Core Data Structures (Weeks 5–8)

*Goal: own the structures interviews are built on — and the search/sort patterns that exploit order.*

### Week 5 — Stacks & Queues
| Chapter | Focus |
|---|---|
| 1. Introduction | LIFO/FIFO mental models, when each wins |
| 2. Classic Stack Patterns | matching pairs, expression evaluation, min stack |
| 3. Monotonic Stack | next greater element, spans |
| 4. Advanced Applications | daily temperatures, largest rectangle in histogram |

Key problems: Valid Parentheses, Min Stack, Evaluate RPN, Daily Temperatures, Largest Rectangle in Histogram.

### Week 6 — Linked Lists
| Chapter | Focus |
|---|---|
| 1. Introduction | nodes, pointers, dummy heads |
| 2. Reversal Patterns | iterative + recursive reversal, reverse in groups |
| 3. Fast & Slow Pointers | cycle detection, middle, intersection |
| 4. Advanced Applications | reorder list, merge k lists, LRU cache |

Key problems: Reverse Linked List, Merge Two Sorted Lists, Linked List Cycle, Reorder List, LRU Cache.

### Week 7 — Binary Search
| Chapter | Focus |
|---|---|
| 1. Introduction | invariants, off-by-one discipline, templates |
| 2. Search on Arrays | exact match, boundaries, rotated arrays |
| 3. Search on Answer Space | min capacity / max speed style problems |
| 4. Advanced Applications | median of two sorted arrays, peak finding |

Key problems: Binary Search, Search in Rotated Sorted Array, Find First and Last Position, Koko Eating Bananas, Median of Two Sorted Arrays.

### Week 8 — Sorting & Intervals
| Chapter | Focus |
|---|---|
| 1. Introduction | comparison sorts, stability, when O(n log n) matters |
| 2. Sorting as Preprocessing | custom comparators, bucket/counting sort |
| 3. Interval Patterns | merge, insert, overlap detection |
| 4. Advanced Applications | meeting rooms II, non-overlapping intervals, sweep line |

Key problems: Sort Colors, Merge Intervals, Insert Interval, Meeting Rooms II, Non-Overlapping Intervals.

---

## Phase 3 — Recursion & Trees (Weeks 9–12)

*Goal: think recursively with confidence — the gateway to trees, backtracking, and DP.*

### Week 9 — Recursion & Backtracking
| Chapter | Focus |
|---|---|
| 1. Introduction | call stack, base cases, recursion trees |
| 2. Generate All Possibilities | subsets, permutations, combinations |
| 3. Constraint Backtracking | pruning, valid placements |
| 4. Advanced Applications | word search, palindrome partitioning, N-Queens |

Key problems: Subsets, Permutations, Combination Sum, Word Search, N-Queens.

### Week 10 — Binary Trees
| Chapter | Focus |
|---|---|
| 1. Introduction | tree anatomy, recursive structure |
| 2. Depth-First Traversals | pre/in/post-order, path problems |
| 3. Breadth-First Traversals | level order, zigzag, right-side view |
| 4. Advanced Applications | diameter, max path sum, serialize/deserialize |

Key problems: Max Depth, Invert Binary Tree, Level Order Traversal, Diameter of Binary Tree, Binary Tree Maximum Path Sum.

### Week 11 — Binary Search Trees & Tree Patterns
| Chapter | Focus |
|---|---|
| 1. Introduction | the BST invariant and what it buys you |
| 2. BST Operations | search, insert, validate, kth smallest |
| 3. Ancestor & Construction Patterns | LCA, build from traversals |
| 4. Advanced Applications | recover BST, BST iterator, count nodes |

Key problems: Validate BST, Kth Smallest in BST, Lowest Common Ancestor, Construct Tree from Preorder+Inorder, BST Iterator.

### Week 12 — Heaps & Priority Queues
| Chapter | Focus |
|---|---|
| 1. Introduction | heap property, array representation, O(log n) ops |
| 2. Top-K Patterns | kth largest, k closest, frequency-based |
| 3. Two-Heap & Streaming Patterns | median from stream, scheduling |
| 4. Advanced Applications | merge k sorted lists, task scheduler, IPO |

Key problems: Kth Largest Element, K Closest Points, Find Median from Data Stream, Task Scheduler, Merge K Sorted Lists.

---

## Phase 4 — Graphs & Advanced Search (Weeks 13–16)

*Goal: model anything as a graph and pick the right traversal instantly.*

### Week 13 — Graph Fundamentals
| Chapter | Focus |
|---|---|
| 1. Introduction | representations: adjacency list/matrix, grids as graphs |
| 2. Depth-First Search | components, flood fill, cycle detection |
| 3. Breadth-First Search | shortest path in unweighted graphs, multi-source BFS |
| 4. Advanced Applications | number of islands, rotting oranges, clone graph |

Key problems: Number of Islands, Clone Graph, Rotting Oranges, Max Area of Island, Pacific Atlantic Water Flow.

### Week 14 — Topological Sort & Union-Find
| Chapter | Focus |
|---|---|
| 1. Introduction | DAGs, dependency thinking, disjoint sets |
| 2. Topological Sort | Kahn's algorithm, DFS ordering, cycle detection |
| 3. Union-Find | union by rank, path compression |
| 4. Advanced Applications | course schedule II, redundant connection, accounts merge |

Key problems: Course Schedule I & II, Number of Connected Components, Redundant Connection, Accounts Merge.

### Week 15 — Shortest Paths & Weighted Graphs
| Chapter | Focus |
|---|---|
| 1. Introduction | when BFS stops working: weights |
| 2. Dijkstra's Algorithm | priority-queue implementation, variants |
| 3. Other Path Algorithms | Bellman-Ford intuition, MST (Prim/Kruskal) |
| 4. Advanced Applications | network delay time, cheapest flights with k stops, swim in rising water |

Key problems: Network Delay Time, Cheapest Flights Within K Stops, Min Cost to Connect All Points, Path With Minimum Effort.

### Week 16 — Tries & Advanced String Patterns
| Chapter | Focus |
|---|---|
| 1. Introduction | prefix trees, when hashing isn't enough |
| 2. Trie Implementation | insert, search, startsWith, wildcard |
| 3. String Matching Patterns | prefix/suffix tricks, rolling hash intuition |
| 4. Advanced Applications | word search II, design add & search words, autocomplete |

Key problems: Implement Trie, Design Add and Search Words, Word Search II, Longest Common Prefix, Replace Words.

---

## Phase 5 — Dynamic Programming & Mastery (Weeks 17–20)

*Goal: turn the hardest interview topic into a repeatable framework, then consolidate everything.*

### Week 17 — DP Foundations (1-D)
| Chapter | Focus |
|---|---|
| 1. Introduction | overlapping subproblems, memoization vs tabulation |
| 2. Decision Patterns | climbing stairs, house robber family |
| 3. Unbounded Choice | coin change, combination counting |
| 4. Advanced Applications | word break, longest increasing subsequence, decode ways |

Key problems: Climbing Stairs, House Robber, Coin Change, Word Break, Longest Increasing Subsequence.

### Week 18 — DP on Grids & Strings (2-D)
| Chapter | Focus |
|---|---|
| 1. Introduction | 2-D state spaces, table-filling order |
| 2. Grid DP | unique paths, min path sum, obstacles |
| 3. String DP | LCS, edit distance, palindromic substrings |
| 4. Advanced Applications | distinct subsequences, interleaving string, regex matching |

Key problems: Unique Paths, Minimum Path Sum, Longest Common Subsequence, Edit Distance, Longest Palindromic Substring.

### Week 19 — Advanced DP & Greedy
| Chapter | Focus |
|---|---|
| 1. Introduction | recognizing knapsack, interval, and state-machine DP |
| 2. Knapsack Patterns | 0/1 knapsack, partition equal subset, target sum |
| 3. Greedy & Exchange Arguments | when greedy beats DP, proof intuition |
| 4. Advanced Applications | best time to buy/sell with cooldown, burst balloons, jump game II |

Key problems: Partition Equal Subset Sum, Target Sum, Jump Game I & II, Gas Station, Burst Balloons.

### Week 20 — Capstone: Interview Simulation
| Chapter | Focus |
|---|---|
| 1. Pattern Recognition Drills | mixed problems, identify-the-pattern speed runs |
| 2. Mock Interview Set A | timed medium problems across all phases |
| 3. Mock Interview Set B | timed medium/hard problems across all phases |
| 4. Final Boss | hardest curated set + full-course revision queue |

Key problems: curated mixed set drawn from weeks 1–19 review queue + 10 new "boss" problems.

---

## Progression Rules

- Chapters unlock sequentially within a week; weeks unlock sequentially within a phase.
- A chapter is complete when: theory read + quiz ≥ 70% + all required practice problems solved.
- Solved problems enter the spaced-repetition queue (day 1 / 3 / 7 / 14 / 30).
- Each week ends with a revision lesson assembled from that week's queue.
