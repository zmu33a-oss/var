#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const outPath = path.join(__dirname, "..", "admin-web", "index.html");

const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>\u0644\u0648\u062d\u0629 \u062a\u062d\u0643\u0645 \u0627\u0644\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0627\u062d\u062a\u0631\u0627\u0641\u064a\u0629</title>
    <!-- Tailwind CSS for modern and premium styling -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Lucide Icons for beautiful clean icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Tajawal:wght@300;400;500;700;800&display=swap');
        
        body {
            font-family: 'Tajawal', 'Plus Jakarta Sans', sans-serif;
            background-color: #09090b;
        }

        /* Neon Glow Effects for X-Mode and TikTok-Mode */
        .glow-xmode {
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.45);
            border-color: #3b82f6;
        }
        
        .glow-tiktok {
            box-shadow: 0 0 15px rgba(236, 72, 153, 0.45);
            border-color: #ec4899;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: #09090b;
        }
        ::-webkit-scrollbar-thumb {
            background: #27272a;
            border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #3f3f46;
        }
    </style>
</head>
<body class="text-zinc-100 min-h-screen flex flex-col overflow-x-hidden">

    <!-- Toast Notifications Container -->
    <div id="toast-container" class="fixed top-5 left-5 z-50 flex flex-col gap-2 pointer-events-none"></div>

    <!-- Login Overlay -->
    <div id="login-overlay" class="fixed inset-0 z-[100] bg-zinc-950 flex items-center justify-center p-6">
        <form id="login-form" class="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-5">
            <div class="text-center space-y-2">
                <div class="mx-auto h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center">
                    <i data-lucide="shield-check" class="w-6 h-6 text-white"></i>
                </div>
                <h1 class="text-xl font-bold text-white">\u062f\u062e\u0648\u0644 \u0644\u0648\u062d\u0629 \u0627\u0644\u0625\u062f\u0627\u0631\u0629</h1>
                <p class="text-xs text-zinc-400">\u0633\u062c\u0651\u0644 \u062f\u062e\u0648\u0644\u0643 \u0628\u062d\u0633\u0627\u0628 \u0627\u0644\u0623\u062f\u0645\u0646 \u0627\u0644\u0645\u0635\u0631\u0651\u062d \u0641\u064a Appwrite</p>
            </div>
            <div>
                <label class="block text-xs font-semibold text-zinc-400 mb-2">\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a</label>
                <input id="login-email" type="email" dir="ltr" required class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="admin@example.com">
            </div>
            <div>
                <label class="block text-xs font-semibold text-zinc-400 mb-2">\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631</label>
                <input id="login-password" type="password" dir="ltr" required class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="********">
            </div>
            <p id="login-error" class="text-xs text-red-400 min-h-[16px]"></p>
            <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm py-3 rounded-xl transition-all">
                \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644
            </button>
        </form>
    </div>

    <!-- MAIN WRAPPER (Full screen with sidebar & main panel) -->
    <div id="admin-shell" class="flex flex-1 w-full min-h-screen hidden">
        
        <!-- SIDEBAR (Right side for RTL layout) -->
        <aside class="w-72 bg-zinc-900 border-l border-zinc-800 flex flex-col justify-between p-6 shrink-0 hidden lg:flex">
            <div>
                <!-- Logo & Brand Info -->
                <div class="flex items-center gap-3 pb-8 border-b border-zinc-800">
                    <div class="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <i data-lucide="shield-check" class="w-6 h-6 text-white"></i>
                    </div>
                    <div>
                        <h1 class="text-lg font-bold tracking-wide bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">\u0646\u0638\u0627\u0645 \u0627\u0644\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0648\u062d\u062f</h1>
                        <span id="server-status-label" class="text-xs text-emerald-400 flex items-center gap-1">
                            <span id="server-status-dot" class="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                            \u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0642\u0642...
                        </span>
                    </div>
                </div>

                <!-- Navigation Menu -->
                <nav class="mt-8 space-y-2">
                    <a href="#dashboard" onclick="switchTab('dashboard', event)" class="nav-item active flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-800/80 text-white transition-all duration-200">
                        <div class="flex items-center gap-3">
                            <i data-lucide="layout-dashboard" class="w-5 h-5 text-indigo-400"></i>
                            <span class="font-medium text-sm">\u0644\u0648\u062d\u0629 \u0627\u0644\u0625\u062d\u0635\u0627\u0626\u064a\u0627\u062a \u0627\u0644\u0639\u0627\u0645\u0629</span>
                        </div>
                        <span class="bg-indigo-500/10 text-indigo-400 text-xs px-2 py-0.5 rounded-full font-bold">\u0645\u0628\u0627\u0634\u0631</span>
                    </a>

                    <a href="#keys-panel" onclick="switchTab('keys-panel', event)" class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100 transition-all duration-200">
                        <i data-lucide="key-round" class="w-5 h-5"></i>
                        <span class="font-medium text-sm">\u062a\u0648\u0644\u064a\u062f \u0648\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0641\u0627\u062a\u064a\u062d</span>
                    </a>

                    <a href="#users-panel" onclick="switchTab('users-panel', event)" class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100 transition-all duration-200">
                        <i data-lucide="users" class="w-5 h-5"></i>
                        <span class="font-medium text-sm">\u0625\u062f\u0627\u0631\u0629 \u0634\u0624\u0648\u0646 \u0627\u0644\u0623\u0639\u0636\u0627\u0621</span>
                    </a>

                    <a href="#mode-panel" onclick="switchTab('mode-panel', event)" class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100 transition-all duration-200">
                        <i data-lucide="sliders" class="w-5 h-5"></i>
                        <span class="font-medium text-sm">\u062a\u062e\u0635\u064a\u0635 \u0648\u0636\u0639 \u0627\u0644\u0648\u0627\u062c\u0647\u0629 (Modes)</span>
                    </a>
                </nav>
            </div>

            <!-- Admin Profile Quick Card -->
            <div class="pt-6 border-t border-zinc-800 flex items-center gap-3">
                <div class="relative">
                    <div id="admin-avatar" class="w-11 h-11 rounded-full object-cover border border-zinc-700 bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-200">A</div>
                    <div class="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-zinc-900"></div>
                </div>
                <div class="overflow-hidden">
                    <p id="admin-name" class="text-sm font-semibold truncate">\u2014</p>
                    <p id="admin-role" class="text-xs text-zinc-500 truncate">\u2014</p>
                </div>
                <button id="logout-btn" type="button" class="mr-auto p-2 text-zinc-500 hover:text-red-400 transition-colors">
                    <i data-lucide="log-out" class="w-5 h-5"></i>
                </button>
            </div>
        </aside>

        <!-- MAIN CONTENT CONTAINER (Expands completely) -->
        <main class="flex-1 flex flex-col min-w-0 bg-zinc-950">
            
            <!-- HEADER (Top Navbar with Mode Switch & User Indicator) -->
            <header class="h-20 border-b border-zinc-850 bg-zinc-900/40 backdrop-blur-md px-6 lg:px-10 flex items-center justify-between gap-4 sticky top-0 z-40">
                
                <!-- Welcome Title / Mobile Menu button -->
                <div class="flex items-center gap-4">
                    <button class="lg:hidden p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-all">
                        <i data-lucide="menu" class="w-6 h-6"></i>
                    </button>
                    <div>
                        <h2 class="text-xl font-bold tracking-tight text-white hidden sm:block" id="page-title">\u0645\u0631\u062d\u0628\u0627\u064b \u0628\u0643 \u0645\u062c\u062f\u062f\u0627\u064b \u0641\u064a \u0627\u0644\u0625\u062f\u0627\u0631\u0629</h2>
                        <p class="text-xs text-zinc-400 hidden sm:block">\u062a\u0635\u0641\u062d \u0634\u0627\u0645\u0644 \u0628\u062f\u0648\u0646 \u0641\u0631\u0627\u063a\u0627\u062a \u0648\u0628\u0643\u0641\u0627\u0621\u0629 \u0639\u0627\u0644\u064a\u0629</p>
                    </div>
                </div>

                <!-- PERSONALIZATION: Dynamic Switch (X-Mode / TikTok-Mode) as requested! -->
                <div class="flex items-center bg-zinc-950 rounded-2xl p-1.5 border border-zinc-800 shadow-inner">
                    <span class="text-xs font-bold text-zinc-400 px-3 hidden md:inline-block select-none">\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0646\u0634\u0637:</span>
                    
                    <button id="btn-xmode" onclick="setGlobalMode('X-Mode')" class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 bg-blue-600 text-white shadow-lg shadow-blue-500/20 glow-xmode">
                        <i data-lucide="zap" class="w-4 h-4 text-amber-300"></i>
                        <span>X-Mode</span>
                    </button>
                    
                    <button id="btn-ttmode" onclick="setGlobalMode('TikTok-Mode')" class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 text-zinc-400 hover:text-zinc-200">
                        <i data-lucide="play" class="w-4 h-4"></i>
                        <span>TikTok-Mode</span>
                    </button>
                </div>

                <!-- Search & Status Notification Bar -->
                <div class="flex items-center gap-3">
                    <div class="relative hidden xl:block">
                        <i data-lucide="search" class="w-4 h-4 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2"></i>
                        <input id="global-search-input" type="text" placeholder="\u0628\u062d\u062b VAR \u0623\u0648 \u0627\u0633\u0645 \u0645\u0633\u062a\u062e\u062f\u0645..." class="bg-zinc-900/60 border border-zinc-800 focus:border-zinc-700 rounded-xl pr-10 pl-4 py-2 text-xs text-zinc-300 focus:outline-none w-64 transition-all">
                    </div>

                    <!-- Notification Bell -->
                    <button id="refresh-dashboard-btn" type="button" class="relative h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800/80 transition-colors" title="\u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a">
                        <i data-lucide="refresh-cw" class="w-5 h-5 text-zinc-400"></i>
                    </button>
                    <button type="button" onclick="showToast('\u0644\u0627 \u062a\u0648\u062c\u062f \u0625\u0634\u0639\u0627\u0631\u0627\u062a \u063a\u064a\u0631 \u0645\u0642\u0631\u0648\u0621\u0629 \u062d\u0627\u0644\u064a\u0627\u064b', 'success')" class="relative h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800/80 transition-colors">
                        <i data-lucide="bell" class="w-5 h-5 text-zinc-400"></i>
                        <span class="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                    </button>
                </div>
            </header>

            <!-- MAIN WORKING AREA (Fills all space nicely) -->
            <div id="dashboard-section" class="p-6 lg:p-10 space-y-8 flex-1 overflow-y-auto max-w-full">

                <!-- 1. STATS SECTION (No empty spaces, well balanced) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <!-- Stat Card 1 -->
                    <div class="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-6 transition-all duration-300 group hover:-translate-y-1">
                        <div class="flex items-start justify-between">
                            <div>
                                <p class="text-xs font-semibold text-zinc-500 tracking-wider">\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646 \u0627\u0644\u0645\u0633\u062c\u0644\u064a\u0646</p>
                                <h3 class="text-3xl font-extrabold text-white mt-2 group-hover:text-indigo-400 transition-colors" id="stat-users">0</h3>
                            </div>
                            <div class="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <i data-lucide="users-2" class="w-6 h-6"></i>
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5 mt-4 text-xs">
                            <span class="text-emerald-400 font-bold flex items-center gap-0.5">
                                <i data-lucide="trending-up" class="w-3.5 h-3.5"></i>
                                +12%
                            </span>
                            <span class="text-zinc-500">\u0645\u0646\u0630 \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u0645\u0627\u0636\u064a</span>
                        </div>
                    </div>

                    <!-- Stat Card 2 -->
                    <div class="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-6 transition-all duration-300 group hover:-translate-y-1">
                        <div class="flex items-start justify-between">
                            <div>
                                <p class="text-xs font-semibold text-zinc-500 tracking-wider">\u0627\u0644\u0645\u0641\u0627\u062a\u064a\u062d \u0627\u0644\u0641\u0639\u0627\u0644\u0629 \u062d\u0627\u0644\u064a\u0627\u064b</p>
                                <h3 class="text-3xl font-extrabold text-white mt-2 group-hover:text-emerald-400 transition-colors" id="stat-keys">0</h3>
                            </div>
                            <div class="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <i data-lucide="key" class="w-6 h-6"></i>
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5 mt-4 text-xs">
                            <span class="text-emerald-400 font-bold flex items-center gap-0.5">
                                <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i>
                                \u0646\u0634\u0637\u0629 \u0628\u0627\u0644\u0643\u0627\u0645\u0644
                            </span>
                            <span class="text-zinc-500">\u062c\u0627\u0647\u0632\u0629 \u0644\u0644\u0627\u0633\u062a\u0639\u0645\u0627\u0644</span>
                        </div>
                    </div>

                    <!-- Stat Card 3 -->
                    <div class="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-6 transition-all duration-300 group hover:-translate-y-1">
                        <div class="flex items-start justify-between">
                            <div>
                                <p class="text-xs font-semibold text-zinc-500 tracking-wider">\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062a</p>
                                <h3 class="text-3xl font-extrabold text-white mt-2 group-hover:text-blue-400 transition-colors" id="stat-posts">0</h3>
                            </div>
                            <div class="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                <i data-lucide="git-compare" class="w-6 h-6"></i>
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5 mt-4 text-xs">
                            <span class="text-zinc-300 font-bold">X-Mode</span>
                            <span class="text-zinc-500">\u0645\u0646 \u0622\u062e\u0631 25 \u0645\u0646\u0634\u0648\u0631</span>
                        </div>
                    </div>

                    <!-- Stat Card 4 -->
                    <div class="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-6 transition-all duration-300 group hover:-translate-y-1">
                        <div class="flex items-start justify-between">
                            <div>
                                <p class="text-xs font-semibold text-zinc-500 tracking-wider">\u0633\u062c\u0644 \u0639\u0645\u0644\u064a\u0627\u062a \u0627\u0644\u0625\u062f\u0627\u0631\u0629</p>
                                <h3 class="text-3xl font-extrabold text-white mt-2 group-hover:text-purple-400 transition-colors" id="stat-audit">0</h3>
                            </div>
                            <div class="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                <i data-lucide="server" class="w-6 h-6"></i>
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5 mt-4 text-xs">
                            <span class="text-emerald-400 font-bold flex items-center gap-0.5">
                                <i data-lucide="shield" class="w-3.5 h-3.5"></i>
                                99.9%
                            </span>
                            <span class="text-zinc-500">\u0645\u0646 \u0633\u062c\u0644 admin_audit</span>
                        </div>
                    </div>
                </div>

                <!-- 2. MAIN WORKING GRID (Left Column: Key Generation & List, Right Column: Mode Controls & System Health) -->
                <div class="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    
                    <!-- LEFT CONTAINER (Takes 8 cols) - Key Generation Form & List -->
                    <div class="xl:col-span-8 space-y-8">
                        
                        <!-- KEY GENERATOR CARD -->
                        <div id="keys-panel" class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                            <div class="flex items-center gap-3 pb-5 border-b border-zinc-800">
                                <div class="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                    <i data-lucide="key-round" class="w-5 h-5"></i>
                                </div>
                                <div>
                                    <h3 class="text-lg font-bold text-white">\u0645\u0646\u0635\u0629 \u062a\u0648\u0644\u064a\u062f \u0645\u0641\u0627\u062a\u064a\u062d \u0627\u0644\u0623\u062f\u0645\u0646 \u0627\u0644\u0645\u062a\u0642\u062f\u0645\u0629</h3>
                                    <p class="text-xs text-zinc-400">\u0623\u062f\u0627\u0629 \u0645\u0631\u0646\u0629 \u0648\u0633\u0631\u064a\u0639\u0629 \u0644\u062a\u0631\u062e\u064a\u0635 \u0627\u0644\u0623\u0643\u0648\u0627\u062f\u060c \u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0627\u062a\u060c \u0648\u0625\u0639\u0637\u0627\u0621 \u0623\u0630\u0648\u0646\u0627\u062a \u0627\u0644\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0627\u0644\u0645\u0624\u0642\u062a\u0629.</p>
                                </div>
                            </div>

                            <!-- Interactive Inputs Form -->
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
                                
                                <!-- Input 1: Key Name/Prefix -->
                                <div>
                                    <label class="block text-xs font-semibold text-zinc-400 mb-2">\u0628\u0627\u062f\u0626\u0629 \u0627\u0644\u0645\u0641\u062a\u0627\u062d \u0623\u0648 \u0627\u0644\u062a\u0633\u0645\u064a\u0629</label>
                                    <input id="key-label" type="text" placeholder="\u0645\u062b\u0627\u0644: DEVELOPER-KEY" class="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 hover:border-zinc-800 focus:outline-none rounded-xl px-4 py-3 text-sm text-white transition-all">
                                </div>

                                <!-- Input 2: Role Level Selection -->
                                <div>
                                    <label class="block text-xs font-semibold text-zinc-400 mb-2">\u0645\u0633\u062a\u0648\u0649 \u0635\u0644\u0627\u062d\u064a\u0627\u062a \u0627\u0644\u0623\u062f\u0645\u0646/\u0627\u0644\u0645\u0634\u0631\u0641</label>
                                    <select id="key-role" class="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 hover:border-zinc-800 focus:outline-none rounded-xl px-4 py-3 text-sm text-white transition-all appearance-none cursor-pointer">
                                        <option value="\u0645\u0633\u0624\u0648\u0644 \u0631\u0626\u064a\u0633\u064a (Super Admin)">\u0645\u0633\u0624\u0648\u0644 \u0631\u0626\u064a\u0633\u064a (Super Admin)</option>
                                        <option value="\u0645\u0634\u0631\u0641 \u062a\u0642\u0646\u064a (Developer)">\u0645\u0634\u0631\u0641 \u062a\u0642\u0646\u064a (Developer)</option>
                                        <option value="\u0645\u062f\u064a\u0631 \u0645\u062d\u062a\u0648\u0649 (Moderator)">\u0645\u062f\u064a\u0631 \u0645\u062d\u062a\u0648\u0649 (Moderator)</option>
                                        <option value="\u0645\u0641\u062a\u0627\u062d \u062a\u062c\u0631\u064a\u0628\u064a (Guest Account)">\u0645\u0641\u062a\u0627\u062d \u062a\u062c\u0631\u064a\u0628\u064a (Guest Account)</option>
                                    </select>
                                </div>

                                <!-- Input 3: Expiration Date -->
                                <div>
                                    <label class="block text-xs font-semibold text-zinc-400 mb-2">\u062a\u0627\u0631\u064a\u062e \u0627\u0646\u062a\u0647\u0627\u0621 \u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0629 (Expiration Date)</label>
                                    <div class="relative">
                                        <select id="key-expiry" onchange="toggleCustomDatePicker()" class="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 hover:border-zinc-800 focus:outline-none rounded-xl px-4 py-3 text-sm text-white transition-all appearance-none cursor-pointer">
                                            <option value="Never">\u0644\u0627 \u064a\u0646\u062a\u0647\u064a \u0623\u0628\u062f\u0627\u064b (Never)</option>
                                            <option value="7 Days">7 \u0623\u064a\u0627\u0645 (7 Days)</option>
                                            <option value="30 days">30 \u064a\u0648\u0645 (30 days)</option>
                                            <option value="90 days">90 \u064a\u0648\u0645 (90 days)</option>
                                            <option value="1 Year">\u0633\u0646\u0629 \u0648\u0627\u062d\u062f\u0629 (1 Year)</option>
                                            <option value="Custom Date">\u062a\u0627\u0631\u064a\u062e \u0645\u062e\u0635\u0635 (Custom Date)</option>
                                        </select>
                                        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center px-4 text-zinc-400">
                                            <i data-lucide="chevron-down" class="w-4 h-4"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Hidden Custom Date Picker Container -->
                            <div id="custom-date-container" class="mt-5 hidden bg-zinc-950/60 p-4 border border-zinc-800 rounded-xl max-w-sm">
                                <label class="block text-xs font-semibold text-zinc-400 mb-2">\u0627\u062e\u062a\u0631 \u0627\u0644\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0645\u062e\u0635\u0635 \u0627\u0644\u0630\u064a \u062a\u0631\u064a\u062f\u0647:</label>
                                <input id="custom-date-picker" type="date" class="bg-zinc-900 border border-zinc-850 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 w-full">
                            </div>

                            <!-- Actions Buttons -->
                            <div class="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-zinc-850">
                                <button onclick="resetKeyForm()" class="bg-zinc-950 hover:bg-zinc-850 text-zinc-400 hover:text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all">
                                    \u0625\u0639\u0627\u062f\u0629 \u062a\u0639\u064a\u064a\u0646 \u0627\u0644\u062d\u0642\u0648\u0644
                                </button>
                                <button onclick="generateNewKey()" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2">
                                    <i data-lucide="plus-circle" class="w-4 h-4"></i>
                                    \u062a\u0648\u0644\u064a\u062f \u0648\u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0645\u0641\u062a\u0627\u062d \u0627\u0644\u0622\u0646
                                </button>
                            </div>
                        </div>

                        <!-- DYNAMIC GENERATED KEYS LIST TABLE -->
                        <div class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                            <div class="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
                                <div class="flex items-center gap-2.5">
                                    <span class="h-3 w-3 rounded-full bg-indigo-500"></span>
                                    <h4 class="font-bold text-white text-base">\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0641\u0627\u062a\u064a\u062d \u0627\u0644\u062d\u0627\u0644\u064a\u0629 \u0641\u064a \u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a</h4>
                                </div>
                                <span id="keys-counter" class="bg-zinc-950 border border-zinc-850 text-xs text-zinc-400 px-3 py-1 rounded-full">\u062a\u062d\u0645\u064a\u0644...</span>
                            </div>

                            <!-- The Keys Table -->
                            <div class="overflow-x-auto">
                                <table class="w-full text-right text-sm">
                                    <thead class="bg-zinc-950 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                                        <tr>
                                            <th class="py-4 px-6">\u0627\u0644\u0645\u0639\u0631\u0641 / \u0627\u0644\u0645\u0641\u062a\u0627\u062d</th>
                                            <th class="py-4 px-6">\u062a\u0633\u0645\u064a\u0629 \u0627\u0644\u0645\u0644\u0641</th>
                                            <th class="py-4 px-6">\u0627\u0644\u0631\u062a\u0628\u0629 \u0648\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0627\u062a</th>
                                            <th class="py-4 px-6">\u0645\u062f\u0629 \u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0629</th>
                                            <th class="py-4 px-6 text-center">\u0627\u0644\u062d\u0627\u0644\u0629 \u0648\u0627\u0644\u0645\u0641\u0639\u0648\u0644</th>
                                            <th class="py-4 px-6 text-center">\u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a</th>
                                        </tr>
                                    </thead>
                                    <tbody id="keys-table-body" class="divide-y divide-zinc-850">
                                        <!-- Will be dynamically filled by JavaScript -->
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- DETAILED USERS MANAGEMENT PANEL -->
                        <div id="users-panel" class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                            <div class="p-6 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h4 class="font-bold text-white text-base">\u0625\u062f\u0627\u0631\u0629 \u0634\u0624\u0648\u0646 \u0627\u0644\u0623\u0639\u0636\u0627\u0621 \u0648\u0627\u0644\u0644\u0627\u0639\u0628\u064a\u0646</h4>
                                    <p class="text-xs text-zinc-500 mt-1">\u0639\u0631\u0636 \u062c\u0645\u064a\u0639 \u062d\u0633\u0627\u0628\u0627\u062a \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646 \u0648\u0625\u0645\u0643\u0627\u0646\u064a\u0629 \u062a\u063a\u064a\u064a\u0631 \u0631\u062a\u0628\u0647\u0645 \u0623\u0648 \u0627\u062a\u062e\u0627\u0630 \u0642\u0631\u0627\u0631\u0627\u062a \u062d\u0638\u0631\u0647\u0645 \u0641\u0648\u0631\u0627\u064b.</p>
                                </div>
                                
                                <!-- Filter Actions -->
                                <div class="flex items-center gap-3">
                                    <input id="user-search-input" onkeyup="filterUsers()" type="text" placeholder="\u0627\u0628\u062d\u062b \u0628\u0640 VAR \u0623\u0648 \u0627\u0633\u0645..." class="bg-zinc-950 border border-zinc-800 focus:border-zinc-700 px-4 py-2 text-xs text-white rounded-lg focus:outline-none w-56">
                                    <select onchange="filterUsersByRole(this.value)" class="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-3 py-2 focus:outline-none cursor-pointer">
                                        <option value="All">\u0627\u0644\u062c\u0645\u064a\u0639</option>
                                        <option value="\u0623\u062f\u0645\u0646">\u0623\u062f\u0645\u0646</option>
                                        <option value="\u0623\u0639\u0636\u0627\u0621">\u0623\u0639\u0636\u0627\u0621</option>
                                    </select>
                                </div>
                            </div>

                            <!-- Users Table -->
                            <div class="overflow-x-auto">
                                <table class="w-full text-right text-sm">
                                    <thead class="bg-zinc-950 text-zinc-400 text-xs font-bold uppercase">
                                        <tr>
                                            <th class="py-4 px-6">\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645</th>
                                            <th class="py-4 px-6">VAR / \u0627\u0644\u0645\u0639\u0631\u0641</th>
                                            <th class="py-4 px-6">\u0627\u0644\u0631\u062a\u0628\u0629</th>
                                            <th class="py-4 px-6">\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u062a\u0633\u062c\u064a\u0644</th>
                                            <th class="py-4 px-6 text-center">\u0627\u0644\u062d\u0627\u0644\u0629</th>
                                            <th class="py-4 px-6 text-center">\u062d\u0638\u0631 \u00b7 \u062a\u0631\u0642\u064a\u0629 \u00b7 \u062d\u0630\u0641</th>
                                        </tr>
                                    </thead>
                                    <tbody id="users-table-body" class="divide-y divide-zinc-850">
                                        <!-- Dynamically generated -->
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>

                    <!-- RIGHT CONTAINER (Takes 4 cols) - Mode Controls & Active System Health Logs -->
                    <div class="xl:col-span-4 space-y-8">
                        
                        <!-- SYSTEM MODES PRESETS AND CONTROLLER -->
                        <div id="mode-panel" class="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                            <div id="mode-glow-decor" class="absolute -right-24 -top-24 w-48 h-48 rounded-full blur-3xl transition-all duration-500 opacity-20 bg-blue-500"></div>

                            <div class="flex items-center gap-3 pb-4 border-b border-zinc-800">
                                <div class="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                                    <i data-lucide="sliders" class="w-5 h-5"></i>
                                </div>
                                <div>
                                    <h4 class="font-bold text-white text-base">\u0645\u062a\u062d\u0643\u0645 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0645\u0632\u062f\u0648\u062c</h4>
                                    <p class="text-xs text-zinc-400">\u062a\u062d\u0643\u0645 \u0628\u0645\u0633\u0627\u0631 \u0648\u0633\u0644\u0648\u0643 \u0648\u0627\u062c\u0647\u0629 \u062a\u0637\u0628\u064a\u0642\u0643 \u0628\u0627\u0644\u0643\u0627\u0645\u0644</p>
                                </div>
                            </div>

                            <!-- Current Mode Status Panel -->
                            <div class="mt-6 p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center">
                                <span class="text-xs text-zinc-500 block uppercase font-bold tracking-widest">\u062a\u0643\u0648\u064a\u0646 \u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u062d\u0627\u0644\u064a</span>
                                <h2 id="current-mode-headline" class="text-2xl font-black mt-2 text-blue-400 transition-colors">X-MODE ACTIVE</h2>
                                <p id="current-mode-desc" class="text-xs text-zinc-400 mt-1 transition-all">\u0645\u062e\u0635\u0635\u0629 \u0644\u0644\u0645\u0637\u0648\u0631\u064a\u0646 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0628 \u0627\u0644\u0633\u0631\u064a\u0639\u0629 \u0645\u0639 \u0648\u0635\u0648\u0644 \u063a\u064a\u0631 \u0645\u062d\u062f\u0648\u062f.</p>
                            </div>

                            <!-- Interactive Config Swaps -->
                            <div class="space-y-4 mt-6">
                                <div class="flex items-center justify-between p-3.5 bg-zinc-950 rounded-xl border border-zinc-850">
                                    <div>
                                        <span class="text-xs font-bold text-zinc-300 block">\u0639\u0631\u0636 \u0623\u064a\u0642\u0648\u0646\u0627\u062a \u0627\u0644\u0648\u0627\u062c\u0647\u0629</span>
                                        <span class="text-[10px] text-zinc-500">\u0645\u0624\u062b\u0631\u0627\u062a \u0628\u0635\u0631\u064a\u0629 \u0648\u0635\u0648\u062a\u064a\u0629 \u0645\u062a\u0637\u0648\u0631\u0629</span>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked class="sr-only peer" onchange="showToast('\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0639\u0631\u0636 \u0627\u0644\u0623\u064a\u0642\u0648\u0646\u0627\u062a \u0628\u0627\u0644\u062e\u0644\u0641\u064a\u0629', 'success')">
                                        <div class="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:content-[''] after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                                    </label>
                                </div>

                                <div class="flex items-center justify-between p-3.5 bg-zinc-950 rounded-xl border border-zinc-850">
                                    <div>
                                        <span class="text-xs font-bold text-zinc-300 block">\u0633\u0631\u0639\u0629 \u0645\u0639\u0627\u0644\u062c\u0629 \u0627\u0644\u0631\u0633\u0648\u0645\u064a\u0627\u062a</span>
                                        <span class="text-[10px] text-zinc-500">\u062a\u0641\u0639\u064a\u0644 \u062a\u0633\u0631\u064a\u0639 \u0627\u0644\u0623\u062c\u0647\u0632\u0629 \u0627\u0644\u062a\u0644\u0642\u0627\u0626\u064a</span>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked class="sr-only peer" onchange="showToast('\u062a\u0645 \u062a\u0645\u0643\u064a\u0646 \u0648\u0636\u0639 \u0627\u0644\u062d\u0648\u0633\u0628\u0629 \u0627\u0644\u0642\u0635\u0648\u0649 \u0644\u0644\u0631\u0633\u0648\u0645\u064a\u0627\u062a', 'info')">
                                        <div class="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:content-[''] after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- LIVE SYSTEM MONITOR / EVENT LOGS -->
                        <div class="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                            <div>
                                <div class="flex items-center justify-between pb-4 border-b border-zinc-800">
                                    <div class="flex items-center gap-2">
                                        <span class="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                                        <h4 class="font-bold text-white text-base">\u0633\u062c\u0644 \u0623\u062d\u062f\u0627\u062b \u0627\u0644\u0646\u0638\u0627\u0645 \u0648\u0627\u0644\u0623\u0645\u0627\u0646</h4>
                                    </div>
                                    <button id="refresh-logs-btn" type="button" class="text-[10px] text-zinc-500 hover:text-indigo-400 transition-colors">\u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0633\u062c\u0644</button>
                                </div>

                                <!-- Scrolling Logs Panel -->
                                <div id="log-feed" class="mt-4 space-y-3 max-h-80 overflow-y-auto pr-1">
                                    <!-- Dynamic Logs -->
                                </div>
                            </div>

                            <!-- System Status Diagnostics Bar -->
                            <div class="mt-6 pt-5 border-t border-zinc-850 space-y-3">
                                <div>
                                    <div class="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                                        <span>\u0627\u0633\u062a\u0647\u0644\u0627\u0643 \u0637\u0627\u0642\u0629 \u0627\u0644\u062e\u0627\u062f\u0645</span>
                                        <span class="font-bold text-emerald-400" id="server-power">24%</span>
                                    </div>
                                    <div class="w-full bg-zinc-950 h-2 rounded-full overflow-hidden">
                                        <div id="server-power-bar" class="bg-emerald-500 h-full w-[24%] transition-all duration-1000"></div>
                                    </div>
                                </div>

                                <div>
                                    <div class="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                                        <span>\u0627\u0633\u062a\u0647\u0644\u0627\u0643 \u0631\u0627\u0645\u0627\u062a \u0627\u0644\u062a\u0637\u0628\u064a\u0642</span>
                                        <span class="font-bold text-indigo-400" id="server-ram">52%</span>
                                    </div>
                                    <div class="w-full bg-zinc-950 h-2 rounded-full overflow-hidden">
                                        <div id="server-ram-bar" class="bg-indigo-500 h-full w-[52%] transition-all duration-1000"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- QUICK ANNOUNCEMENT / INFORMATION BOX -->
                        <div class="bg-gradient-to-tr from-indigo-950/40 to-zinc-900 border border-indigo-900/40 rounded-2xl p-6 relative overflow-hidden">
                            <i data-lucide="sparkles" class="w-24 h-24 text-indigo-500/10 absolute -left-4 -bottom-4 rotate-12"></i>
                            <h5 class="text-white font-bold text-sm mb-2 flex items-center gap-2">
                                <i data-lucide="info" class="w-4 h-4 text-indigo-400"></i>
                                \u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0627\u0644\u0645\u0637\u0648\u0631\u064a\u0646
                            </h5>
                            <p class="text-xs text-zinc-400 leading-relaxed">
                                \u064a\u0645\u0643\u0646\u0643 \u062a\u0648\u0644\u064a\u062f \u0623\u064a \u0639\u062f\u062f \u0645\u0646 \u0645\u0641\u0627\u062a\u064a\u062d \u0627\u0644\u0625\u062f\u0627\u0631\u0629 \u0644\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0627\u062a. \u0641\u064a \u062d\u0627\u0644 \u0627\u062e\u062a\u064a\u0627\u0631 \u062a\u0627\u0631\u064a\u062e \u0627\u0646\u062a\u0647\u0627\u0621 \u0645\u062e\u0635\u0635\u060c \u0633\u064a\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u062e\u0635\u0627\u0626\u0635 \u0627\u0644\u0645\u062d\u062f\u062f\u0629 \u0641\u0648\u0631\u0627\u064b \u0648\u062a\u0637\u0628\u064a\u0642\u0647\u0627 \u0644\u062d\u0645\u0627\u064a\u0629 \u0644\u0648\u062d\u0629 \u0627\u0644\u0625\u062f\u0627\u0631\u0629 \u0645\u0646 \u0627\u0644\u0645\u062a\u0633\u0644\u0644\u064a\u0646.
                            </p>
                        </div>

                    </div>

                </div>

            </div>

            <!-- FOOTER -->
            <footer class="h-16 border-t border-zinc-850 flex items-center justify-between px-6 lg:px-10 text-xs text-zinc-500 bg-zinc-900/20 mt-auto">
                <p>\u00a9 2026 \u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0642\u0648\u0642 \u0645\u062d\u0641\u0648\u0638\u0629 \u0644\u063a\u0631\u0641\u0629 \u062a\u062d\u0643\u0645 \u0627\u0644\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0639\u0644\u064a\u0627.</p>
                <div class="flex items-center gap-4">
                    <a href="#" class="hover:text-zinc-300 transition-colors">\u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u062d\u0645\u0627\u064a\u0629</a>
                    <span>|</span>
                    <a href="#" class="hover:text-zinc-300 transition-colors">\u0625\u0635\u062f\u0627\u0631 \u0627\u0644\u0646\u0638\u0627\u0645 v4.2.1</a>
                </div>
            </footer>

        </main>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/appwrite@14.0.1/dist/iife/sdk.js"></script>
    <script src="admin.js"></script>
</body>
</html>
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html, "utf8");

const sample = fs.readFileSync(outPath, "utf8");
const loginHeading = sample.match(/<h1 class="text-xl font-bold text-white">([^<]+)<\/h1>/);
const hasLoginForm = sample.includes('id="login-form"');
const hasAdminShell = sample.includes('id="admin-shell"');
const hasScripts =
  sample.includes('appwrite@14.0.1') && sample.includes('admin.js') && !sample.includes("<script>\n");

console.log("Wrote:", outPath);
console.log("Login heading:", loginHeading ? loginHeading[1] : "(missing)");
console.log("Checks:", { hasLoginForm, hasAdminShell, hasScripts, bytes: Buffer.byteLength(sample, "utf8") });

if (!loginHeading || loginHeading[1] !== "\u062f\u062e\u0648\u0644 \u0644\u0648\u062d\u0629 \u0627\u0644\u0625\u062f\u0627\u0631\u0629") {
  process.exitCode = 1;
  console.error("UTF-8 verification failed: login heading is not correct Arabic.");
}
