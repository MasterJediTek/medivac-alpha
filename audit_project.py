#!/usr/bin/env python3
"""
Pre-Release Audit Analysis Script
Analyzes a software project for release readiness: tests, code quality, outstanding items, unused code
"""

import os
import re
import json
from pathlib import Path
from collections import defaultdict

def analyze_todo_file(todo_path):
    """Parse todo.md and extract completed/outstanding items by section"""
    if not os.path.exists(todo_path):
        return {}, {}, 0
    
    with open(todo_path, 'r') as f:
        lines = f.readlines()
    
    sections = defaultdict(lambda: {'completed': 0, 'outstanding': 0, 'items': []})
    current_section = 'Uncategorized'
    
    for line in lines:
        if line.startswith('## '):
            current_section = line.strip().lstrip('# ').strip()
        elif '- [x]' in line:
            sections[current_section]['completed'] += 1
        elif '- [ ]' in line:
            item = line.strip().lstrip('- [ ] ')
            sections[current_section]['outstanding'] += 1
            sections[current_section]['items'].append(item)
    
    total_completed = sum(s['completed'] for s in sections.values())
    total_outstanding = sum(s['outstanding'] for s in sections.values())
    
    return sections, {'completed': total_completed, 'outstanding': total_outstanding}, total_outstanding

def count_services(lib_path):
    """Count defined vs imported services"""
    services_dir = os.path.join(lib_path, 'services')
    if not os.path.exists(services_dir):
        return 0, 0, []
    
    defined = [f.replace('.ts', '') for f in os.listdir(services_dir) 
               if f.endswith('.ts') and not f.endswith('.test.ts') and not f.startswith('__')]
    
    return len(defined), defined

def count_screens(app_path):
    """Count all screens (tab and root level)"""
    screens = []
    
    # Tab screens
    tabs_path = os.path.join(app_path, '(tabs)')
    if os.path.exists(tabs_path):
        tab_screens = [f.replace('.tsx', '') for f in os.listdir(tabs_path) 
                      if f.endswith('.tsx') and f != '_layout.tsx']
        screens.extend([(s, 'tab') for s in tab_screens])
    
    # Root screens
    root_screens = [f.replace('.tsx', '') for f in os.listdir(app_path) 
                   if f.endswith('.tsx') and f != '_layout.tsx' and not f.startswith('(')]
    screens.extend([(s, 'root') for s in root_screens])
    
    return screens

def analyze_test_results(project_path):
    """Extract test results from package.json and test output"""
    # This would parse actual test output; for now return placeholder
    return {'total': 0, 'passed': 0, 'failed': 0, 'skipped': 0}

def main():
    import sys
    if len(sys.argv) < 2:
        print("Usage: python audit_project.py <project_path>")
        sys.exit(1)
    
    project_path = sys.argv[1]
    
    # Analyze todo.md
    todo_path = os.path.join(project_path, 'todo.md')
    sections, totals, outstanding_count = analyze_todo_file(todo_path)
    
    # Count services
    lib_path = os.path.join(project_path, 'lib')
    service_count, defined_services = count_services(lib_path)
    
    # Count screens
    app_path = os.path.join(project_path, 'app')
    screens = count_screens(app_path)
    
    # Generate report
    print("\n=== PRE-RELEASE AUDIT SUMMARY ===\n")
    print(f"Project: {os.path.basename(project_path)}")
    print(f"Path: {project_path}\n")
    
    print(f"Completion Status:")
    print(f"  Completed items: {totals['completed']}")
    print(f"  Outstanding items: {totals['outstanding']}")
    print(f"  Completion rate: {totals['completed'] / (totals['completed'] + totals['outstanding']) * 100:.1f}%\n")
    
    print(f"Code Metrics:")
    print(f"  Services defined: {service_count}")
    print(f"  Screens: {len(screens)} ({sum(1 for s in screens if s[1] == 'tab')} tab, {sum(1 for s in screens if s[1] == 'root')} root)\n")
    
    print(f"Outstanding Items by Section:")
    for section in sorted(sections.keys()):
        if sections[section]['outstanding'] > 0:
            print(f"  [{section}] {sections[section]['outstanding']} items")
    
    print(f"\nTotal sections with outstanding work: {sum(1 for s in sections.values() if s['outstanding'] > 0)}")

if __name__ == '__main__':
    main()
