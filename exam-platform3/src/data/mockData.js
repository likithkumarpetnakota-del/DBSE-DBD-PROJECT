// Mock data — metadata & base seeds aligned with MongoDB.

export const SUBJECT_META = {
  "Data Structures & Algorithms": { color: "#4f7cff", icon: "layers" },
  "Computer Networks": { color: "#22d3ee", icon: "wifi" },
  "Database Management Systems": { color: "#8b5cf6", icon: "database" },
  "Operating Systems": { color: "#f59e0b", icon: "cpu" },
  "AI & Machine Learning": { color: "#22c55e", icon: "brain" },
};

export const EXAMS = [
  {
    id: "exam-dsa-01",
    subject: "Data Structures & Algorithms",
    title: "DSA Midterm Assessment",
    durationMins: 30,
    date: "2026-08-22",
    status: "upcoming",
    difficulty: "Medium",
    questions: [
      {
        id: "q1",
        text: "What is the worst-case time complexity of binary search on a sorted array of n elements?",
        options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
        answer: 1,
      },
      {
        id: "q2",
        text: "Which data structure uses LIFO (Last In First Out) ordering?",
        options: ["Queue", "Stack", "Linked List", "Heap"],
        answer: 1,
      },
      {
        id: "q3",
        text: "In a balanced binary search tree, the height is proportional to:",
        options: ["n", "log n", "n^2", "sqrt(n)"],
        answer: 1,
      },
      {
        id: "q4",
        text: "Which sorting algorithm has the best average-case time complexity?",
        options: ["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"],
        answer: 2,
      },
      {
        id: "q5",
        text: "A graph traversal that explores as far as possible along each branch before backtracking is called:",
        options: ["BFS", "DFS", "Dijkstra's", "Topological Sort"],
        answer: 1,
      },
      {
        id: "q6",
        text: "What is the space complexity of an adjacency matrix for a graph with V vertices?",
        options: ["O(V)", "O(V + E)", "O(V^2)", "O(E)"],
        answer: 2,
      },
      {
        id: "q7",
        text: "Which of these is NOT a stable sorting algorithm?",
        options: ["Merge Sort", "Insertion Sort", "Quick Sort", "Bubble Sort"],
        answer: 2,
      },
      {
        id: "q8",
        text: "A hash table with poor hash function distribution suffers primarily from:",
        options: ["Underflow", "Collisions", "Overflow", "Fragmentation"],
        answer: 1,
      },
    ],
  },
  {
    id: "exam-cn-01",
    subject: "Computer Networks",
    title: "Networking Fundamentals Quiz",
    durationMins: 20,
    date: "2026-08-25",
    status: "upcoming",
    difficulty: "Easy",
    questions: [
      {
        id: "q1",
        text: "Which layer of the OSI model is responsible for routing?",
        options: ["Data Link", "Network", "Transport", "Session"],
        answer: 1,
      },
      {
        id: "q2",
        text: "What does TCP guarantee that UDP does not?",
        options: ["Speed", "Reliable delivery", "Lower overhead", "Broadcast support"],
        answer: 1,
      },
      {
        id: "q3",
        text: "Which protocol resolves domain names to IP addresses?",
        options: ["DHCP", "DNS", "FTP", "ARP"],
        answer: 1,
      },
      {
        id: "q4",
        text: "A /24 subnet mask allows how many usable host addresses?",
        options: ["254", "256", "128", "512"],
        answer: 0,
      },
      {
        id: "q5",
        text: "Which port does HTTPS use by default?",
        options: ["80", "21", "443", "25"],
        answer: 2,
      },
      {
        id: "q6",
        text: "In the TCP three-way handshake, the correct order is:",
        options: ["ACK, SYN, SYN-ACK", "SYN, SYN-ACK, ACK", "SYN, ACK, SYN-ACK", "SYN-ACK, SYN, ACK"],
        answer: 1,
      },
    ],
  },
  {
    id: "exam-dbms-01",
    subject: "Database Management Systems",
    title: "SQL & Normalization Test",
    durationMins: 25,
    date: "2026-08-10",
    status: "upcoming",
    difficulty: "Medium",
    questions: [
      {
        id: "q1",
        text: "Which SQL clause is used to filter groups after aggregation?",
        options: ["WHERE", "HAVING", "GROUP BY", "FILTER"],
        answer: 1,
      },
      {
        id: "q2",
        text: "A table is in 2NF if it is in 1NF and:",
        options: [
          "Has no transitive dependency",
          "Has no partial dependency on the primary key",
          "Has no multi-valued dependency",
          "Has a foreign key",
        ],
        answer: 1,
      },
      {
        id: "q3",
        text: "Which SQL join returns all rows from both tables, matched where possible?",
        options: ["INNER JOIN", "LEFT JOIN", "FULL OUTER JOIN", "CROSS JOIN"],
        answer: 2,
      },
      {
        id: "q4",
        text: "What does ACID stand for in transactions?",
        options: [
          "Atomicity, Consistency, Isolation, Durability",
          "Accuracy, Consistency, Integrity, Durability",
          "Atomicity, Concurrency, Isolation, Durability",
          "Atomicity, Consistency, Indexing, Durability",
        ],
        answer: 0,
      },
    ],
  },
];
