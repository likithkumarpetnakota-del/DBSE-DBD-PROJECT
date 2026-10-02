import sys
import os
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import users_collection, exams_collection, questions_collection, submissions_collection

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed():
    print("Seeding database...")

    # Clear existing collections if desired or update
    users_collection.delete_many({})
    exams_collection.delete_many({})
    questions_collection.delete_many({})
    submissions_collection.delete_many({})

    # 1. Create Users
    student_hash = pwd_context.hash("password123")
    admin_hash = pwd_context.hash("admin123")

    student = {
        "name": "Likith Reddy",
        "email": "likith.student@campus.edu",
        "password_hash": student_hash,
        "student_id": "CS21B045",
        "department": "Computer Science",
        "year": 4,
        "role": "student",
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    student_res = users_collection.insert_one(student)
    student_id_str = str(student_res.inserted_id)

    admin = {
        "name": "Dr. Anita Rao",
        "email": "anita.rao@campus.edu",
        "password_hash": admin_hash,
        "student_id": "ADM001",
        "department": "Examination Controller",
        "year": 1,
        "role": "admin",
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    admin_res = users_collection.insert_one(admin)
    admin_id_str = str(admin_res.inserted_id)

    print("Created Student & Admin accounts")


    now = datetime.now(timezone.utc)
    one_day = timedelta(days=1)
    seven_days = timedelta(days=7)

    # 2. Create Exams & Questions
    exams_data = [
        {
            "title": "DSA Midterm Assessment",
            "subject": "Data Structures & Algorithms",
            "description": "Assessment covering binary search, stacks, trees, and graph algorithms.",
            "duration_minutes": 30,
            "total_marks": 8,
            "passing_marks": 4,
            "total_questions": 8,
            "start_time": now - timedelta(hours=1),
            "end_time": now + seven_days,
            "status": "active",
            "created_by": admin_id_str,
            "questions": [
                {
                    "question_text": "What is the worst-case time complexity of binary search on a sorted array of n elements?",
                    "options": ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
                    "correct_option": 1,
                    "marks": 1,
                    "difficulty": "Medium",
                    "category": "Algorithms"
                },
                {
                    "question_text": "Which data structure uses LIFO (Last In First Out) ordering?",
                    "options": ["Queue", "Stack", "Linked List", "Heap"],
                    "correct_option": 1,
                    "marks": 1,
                    "difficulty": "Easy",
                    "category": "Data Structures"
                },
                {
                    "question_text": "In a balanced binary search tree, the height is proportional to:",
                    "options": ["n", "log n", "n^2", "sqrt(n)"],
                    "correct_option": 1,
                    "marks": 1,
                    "difficulty": "Medium",
                    "category": "Trees"
                },
                {
                    "question_text": "Which sorting algorithm has the best average-case time complexity?",
                    "options": ["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"],
                    "correct_option": 2,
                    "marks": 1,
                    "difficulty": "Easy",
                    "category": "Sorting"
                },
                {
                    "question_text": "A graph traversal that explores as far as possible along each branch before backtracking is called:",
                    "options": ["BFS", "DFS", "Dijkstra's", "Topological Sort"],
                    "correct_option": 1,
                    "marks": 1,
                    "difficulty": "Medium",
                    "category": "Graphs"
                },
                {
                    "question_text": "What is the space complexity of an adjacency matrix for a graph with V vertices?",
                    "options": ["O(V)", "O(V + E)", "O(V^2)", "O(E)"],
                    "correct_option": 2,
                    "marks": 1,
                    "difficulty": "Hard",
                    "category": "Graphs"
                },
                {
                    "question_text": "Which of these is NOT a stable sorting algorithm?",
                    "options": ["Merge Sort", "Insertion Sort", "Quick Sort", "Bubble Sort"],
                    "correct_option": 2,
                    "marks": 1,
                    "difficulty": "Medium",
                    "category": "Sorting"
                },
                {
                    "question_text": "A hash table with poor hash function distribution suffers primarily from:",
                    "options": ["Underflow", "Collisions", "Overflow", "Fragmentation"],
                    "correct_option": 1,
                    "marks": 1,
                    "difficulty": "Easy",
                    "category": "Hashing"
                }
            ]
        },
        {
            "title": "Networking Fundamentals Quiz",
            "subject": "Computer Networks",
            "description": "Fundamentals of OSI layers, TCP/UDP, DNS, subnets, and HTTP/HTTPS protocols.",
            "duration_minutes": 20,
            "total_marks": 6,
            "passing_marks": 3,
            "total_questions": 6,
            "start_time": now - timedelta(hours=2),
            "end_time": now + seven_days,
            "status": "active",
            "created_by": admin_id_str,
            "questions": [
                {
                    "question_text": "Which layer of the OSI model is responsible for routing?",
                    "options": ["Data Link", "Network", "Transport", "Session"],
                    "correct_option": 1,
                    "marks": 1,
                    "difficulty": "Easy",
                    "category": "OSI Model"
                },
                {
                    "question_text": "What does TCP guarantee that UDP does not?",
                    "options": ["Speed", "Reliable delivery", "Lower overhead", "Broadcast support"],
                    "correct_option": 1,
                    "marks": 1,
                    "difficulty": "Easy",
                    "category": "Protocols"
                },
                {
                    "question_text": "Which protocol resolves domain names to IP addresses?",
                    "options": ["DHCP", "DNS", "FTP", "ARP"],
                    "correct_option": 1,
                    "marks": 1,
                    "difficulty": "Easy",
                    "category": "Protocols"
                },
                {
                    "question_text": "A /24 subnet mask allows how many usable host addresses?",
                    "options": ["254", "256", "128", "512"],
                    "correct_option": 0,
                    "marks": 1,
                    "difficulty": "Medium",
                    "category": "Subnetting"
                },
                {
                    "question_text": "Which port does HTTPS use by default?",
                    "options": ["80", "21", "443", "25"],
                    "correct_option": 2,
                    "marks": 1,
                    "difficulty": "Easy",
                    "category": "Security"
                },
                {
                    "question_text": "In the TCP three-way handshake, the correct order is:",
                    "options": ["ACK, SYN, SYN-ACK", "SYN, SYN-ACK, ACK", "SYN, ACK, SYN-ACK", "SYN-ACK, SYN, ACK"],
                    "correct_option": 1,
                    "marks": 1,
                    "difficulty": "Medium",
                    "category": "Handshake"
                }
            ]
        },
        {
            "title": "SQL & Normalization Test",
            "subject": "Database Management Systems",
            "description": "Comprehensive test on relational schema, SQL queries, normalization, and transactions.",
            "duration_minutes": 25,
            "total_marks": 4,
            "passing_marks": 2,
            "total_questions": 4,
            "start_time": now - timedelta(hours=3),
            "end_time": now + seven_days,
            "status": "active",
            "created_by": admin_id_str,
            "questions": [
                {
                    "question_text": "Which SQL clause is used to filter groups after aggregation?",
                    "options": ["WHERE", "HAVING", "GROUP BY", "FILTER"],
                    "correct_option": 1,
                    "marks": 1,
                    "difficulty": "Medium",
                    "category": "SQL"
                },
                {
                    "question_text": "A table is in 2NF if it is in 1NF and:",
                    "options": [
                        "Has no transitive dependency",
                        "Has no partial dependency on the primary key",
                        "Has no multi-valued dependency",
                        "Has a foreign key"
                    ],
                    "correct_option": 1,
                    "marks": 1,
                    "difficulty": "Medium",
                    "category": "Normalization"
                },
                {
                    "question_text": "Which SQL join returns all rows from both tables, matched where possible?",
                    "options": ["INNER JOIN", "LEFT JOIN", "FULL OUTER JOIN", "CROSS JOIN"],
                    "correct_option": 2,
                    "marks": 1,
                    "difficulty": "Easy",
                    "category": "SQL"
                },
                {
                    "question_text": "What does ACID stand for in transactions?",
                    "options": [
                        "Atomicity, Consistency, Isolation, Durability",
                        "Accuracy, Consistency, Integrity, Durability",
                        "Atomicity, Concurrency, Isolation, Durability",
                        "Atomicity, Consistency, Indexing, Durability"
                    ],
                    "correct_option": 0,
                    "marks": 1,
                    "difficulty": "Easy",
                    "category": "Transactions"
                }
            ]
        }
    ]

    for item in exams_data:
        qs = item.pop("questions")
        item["created_at"] = now
        item["updated_at"] = now
        exam_res = exams_collection.insert_one(item)
        exam_id = exam_res.inserted_id

        for q in qs:
            q["exam_id"] = exam_id
            q["created_by"] = admin_id_str
            questions_collection.insert_one(q)

    print("Created default exams & questions")
    print("Seeding complete!")

if __name__ == "__main__":
    seed()

