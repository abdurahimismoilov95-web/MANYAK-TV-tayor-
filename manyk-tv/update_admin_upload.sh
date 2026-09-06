#!/bin/bash
sed -i "s/useState<Record<string, number>>({})/useState<Record<string, { progress: number; status: 'loading' | 'success' | 'error' }>>({})/g" src/components/AdminPanel.tsx
