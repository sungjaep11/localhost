(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/app/game/song-guess/create/genre/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>GenreSelectionPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const genres = [
    '발라드',
    'K-pop',
    'J-pop',
    '팝송',
    '댄스',
    '인디',
    'R&B',
    '힙합'
];
const STORAGE_KEY = 'song-guess-rooms';
function GenreSelectionPage() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const rounds = parseInt(searchParams.get('rounds') || '4', 10);
    const [selectedGenres, setSelectedGenres] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const toggleGenre = (genre)=>{
        if (selectedGenres.includes(genre)) {
            setSelectedGenres(selectedGenres.filter((g)=>g !== genre));
        } else {
            if (selectedGenres.length < rounds) {
                setSelectedGenres([
                    ...selectedGenres,
                    genre
                ]);
            }
        }
    };
    const handleCreateRoom = ()=>{
        if (selectedGenres.length !== rounds) {
            alert(`라운드 개수(${rounds}개)만큼 장르를 선택해주세요.`);
            return;
        }
        // sessionStorage에서 임시 저장된 방 정보 가져오기
        const tempRoomInfo = sessionStorage.getItem('temp-room-info');
        if (!tempRoomInfo) {
            alert('방 정보를 찾을 수 없습니다. 다시 시도해주세요.');
            router.push('/game/song-guess/create');
            return;
        }
        try {
            const roomInfo = JSON.parse(tempRoomInfo);
            // 현재 사용자 정보 가져오기
            let currentUser = {
                id: localStorage.getItem('userId') || `user-${Date.now()}`,
                name: localStorage.getItem('userName') || '사용자'
            };
            // userId와 userName이 없으면 저장
            if (!localStorage.getItem('userId')) {
                localStorage.setItem('userId', currentUser.id);
            }
            if (!localStorage.getItem('userName')) {
                const userName = prompt('이름을 입력하세요:') || '사용자';
                localStorage.setItem('userName', userName);
                currentUser.name = userName;
            }
            // 새 방 생성
            const newRoom = {
                id: `room-${Date.now()}`,
                name: roomInfo.name,
                currentPlayers: 1,
                maxPlayers: roomInfo.maxPlayers,
                isLocked: !roomInfo.isPublic,
                password: roomInfo.password,
                hostId: currentUser.id,
                hostName: currentUser.name,
                rounds: roomInfo.rounds,
                songsPerRound: roomInfo.songsPerRound,
                genres: selectedGenres,
                createdAt: Date.now()
            };
            // localStorage에 방 추가
            const existingRooms = localStorage.getItem(STORAGE_KEY);
            const rooms = existingRooms ? JSON.parse(existingRooms) : [];
            rooms.push(newRoom);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
            // 방장을 참가자 목록에 추가
            const playersKey = `song-guess-room-${newRoom.id}-players`;
            const hostPlayer = {
                id: currentUser.id,
                name: currentUser.name,
                isHost: true,
                joinedAt: Date.now()
            };
            localStorage.setItem(playersKey, JSON.stringify([
                hostPlayer
            ]));
            // 임시 정보 삭제
            sessionStorage.removeItem('temp-room-info');
            // 대기실로 이동
            router.push(`/game/song-guess/${newRoom.id}/waiting`);
        } catch (e) {
            console.error('Failed to create room', e);
            alert('방 생성에 실패했습니다. 다시 시도해주세요.');
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        style: {
            height: "100vh",
            backgroundImage: "url('/images/background.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            position: "relative"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "floating-notes",
                children: [
                    ...Array(6)
                ].map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `floating-note note-${i}`,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            width: "24",
                            height: "24",
                            viewBox: "0 0 24 24",
                            fill: "currentColor",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                d: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/game/song-guess/create/genre/page.tsx",
                                lineNumber: 149,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/game/song-guess/create/genre/page.tsx",
                            lineNumber: 148,
                            columnNumber: 13
                        }, this)
                    }, i, false, {
                        fileName: "[project]/frontend/app/game/song-guess/create/genre/page.tsx",
                        lineNumber: 147,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/app/game/song-guess/create/genre/page.tsx",
                lineNumber: 145,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    maxWidth: "800px",
                    width: "100%",
                    textAlign: "center"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>router.push('/game/song-guess/create'),
                        style: {
                            position: "absolute",
                            top: "2rem",
                            left: "2rem",
                            background: "rgba(0, 0, 0, 0.5)",
                            border: "2px solid rgba(0, 255, 255, 0.5)",
                            borderRadius: "12px",
                            padding: "0.75rem 1rem",
                            color: "#00ffff",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            transition: "all 0.3s ease"
                        },
                        onMouseEnter: (e)=>{
                            e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.8)";
                            e.currentTarget.style.boxShadow = "0 0 15px rgba(0, 255, 255, 0.5)";
                        },
                        onMouseLeave: (e)=>{
                            e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.5)";
                            e.currentTarget.style.boxShadow = "none";
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                width: "20",
                                height: "20",
                                viewBox: "0 0 24 24",
                                fill: "none",
                                stroke: "currentColor",
                                strokeWidth: 2,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    d: "M15 19l-7-7 7-7"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/game/song-guess/create/genre/page.tsx",
                                    lineNumber: 190,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/game/song-guess/create/genre/page.tsx",
                                lineNumber: 189,
                                columnNumber: 11
                            }, this),
                            "뒤로"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/game/song-guess/create/genre/page.tsx",
                        lineNumber: 163,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        style: {
                            fontSize: "2rem",
                            fontWeight: 800,
                            marginBottom: "3rem",
                            background: "linear-gradient(135deg, #00ffff, #ff00ff)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            textShadow: "0 0 20px rgba(0, 255, 255, 0.5)"
                        },
                        children: [
                            "게임하실 장르를 선택해주세요! (",
                            rounds,
                            "라운드)"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/game/song-guess/create/genre/page.tsx",
                        lineNumber: 196,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: "1.5rem",
                            marginBottom: "3rem"
                        },
                        children: genres.map((genre)=>{
                            const isSelected = selectedGenres.includes(genre);
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>toggleGenre(genre),
                                disabled: !isSelected && selectedGenres.length >= rounds,
                                style: {
                                    padding: "1.5rem",
                                    background: isSelected ? "linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(255, 0, 255, 0.3))" : "rgba(0, 0, 0, 0.6)",
                                    border: isSelected ? "3px solid rgba(0, 255, 255, 0.9)" : "2px solid rgba(0, 255, 255, 0.4)",
                                    borderRadius: "12px",
                                    color: "#ffffff",
                                    fontSize: "1.1rem",
                                    fontWeight: 600,
                                    cursor: !isSelected && selectedGenres.length >= rounds ? "not-allowed" : "pointer",
                                    transition: "all 0.3s ease",
                                    opacity: !isSelected && selectedGenres.length >= rounds ? 0.5 : 1,
                                    boxShadow: isSelected ? "0 0 30px rgba(0, 255, 255, 0.5), 0 0 50px rgba(255, 0, 255, 0.3)" : "none"
                                },
                                onMouseEnter: (e)=>{
                                    if (!(!isSelected && selectedGenres.length >= rounds)) {
                                        e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.8)";
                                        e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.3)";
                                        e.currentTarget.style.transform = "translateY(-3px)";
                                    }
                                },
                                onMouseLeave: (e)=>{
                                    if (!isSelected) {
                                        e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.4)";
                                        e.currentTarget.style.boxShadow = "none";
                                        e.currentTarget.style.transform = "translateY(0)";
                                    }
                                },
                                children: genre
                            }, genre, false, {
                                fileName: "[project]/frontend/app/game/song-guess/create/genre/page.tsx",
                                lineNumber: 223,
                                columnNumber: 15
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/game/song-guess/create/genre/page.tsx",
                        lineNumber: 212,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginBottom: "2rem",
                            color: "rgba(255, 255, 255, 0.8)",
                            fontSize: "1rem"
                        },
                        children: [
                            "선택된 장르: ",
                            selectedGenres.length,
                            " / ",
                            rounds
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/game/song-guess/create/genre/page.tsx",
                        lineNumber: 268,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleCreateRoom,
                        disabled: selectedGenres.length !== rounds,
                        style: {
                            padding: "1.25rem 3rem",
                            background: selectedGenres.length === rounds ? "linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(255, 0, 255, 0.3))" : "rgba(0, 0, 0, 0.3)",
                            border: selectedGenres.length === rounds ? "3px solid rgba(0, 255, 255, 0.8)" : "2px solid rgba(255, 255, 255, 0.3)",
                            borderRadius: "12px",
                            color: selectedGenres.length === rounds ? "#00ffff" : "rgba(255, 255, 255, 0.5)",
                            fontSize: "1.1rem",
                            fontWeight: 700,
                            cursor: selectedGenres.length === rounds ? "pointer" : "not-allowed",
                            transition: "all 0.3s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            margin: "0 auto"
                        },
                        onMouseEnter: (e)=>{
                            if (selectedGenres.length === rounds) {
                                e.currentTarget.style.background = "linear-gradient(135deg, rgba(0, 255, 255, 0.4), rgba(255, 0, 255, 0.4))";
                                e.currentTarget.style.boxShadow = "0 0 40px rgba(0, 255, 255, 0.6)";
                                e.currentTarget.style.transform = "translateY(-3px)";
                            }
                        },
                        onMouseLeave: (e)=>{
                            if (selectedGenres.length === rounds) {
                                e.currentTarget.style.background = "linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(255, 0, 255, 0.3))";
                                e.currentTarget.style.boxShadow = "none";
                                e.currentTarget.style.transform = "translateY(0)";
                            }
                        },
                        children: [
                            "방 생성하기",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                width: "20",
                                height: "20",
                                viewBox: "0 0 24 24",
                                fill: "none",
                                stroke: "currentColor",
                                strokeWidth: 2,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    d: "M9 5l7 7-7 7"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/game/song-guess/create/genre/page.tsx",
                                    lineNumber: 318,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/game/song-guess/create/genre/page.tsx",
                                lineNumber: 317,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/game/song-guess/create/genre/page.tsx",
                        lineNumber: 279,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/app/game/song-guess/create/genre/page.tsx",
                lineNumber: 155,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/app/game/song-guess/create/genre/page.tsx",
        lineNumber: 128,
        columnNumber: 5
    }, this);
}
_s(GenreSelectionPage, "2CrQdwqxOuCSSc7wFjcDqFIVCA8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"]
    ];
});
_c = GenreSelectionPage;
var _c;
__turbopack_context__.k.register(_c, "GenreSelectionPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/frontend/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
/**
 * @license React
 * react-jsx-dev-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ "use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch(type){
            case REACT_FRAGMENT_TYPE:
                return "Fragment";
            case REACT_PROFILER_TYPE:
                return "Profiler";
            case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
            case REACT_SUSPENSE_TYPE:
                return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
                return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
                return "ViewTransition";
        }
        if ("object" === typeof type) switch("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof){
            case REACT_PORTAL_TYPE:
                return "Portal";
            case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
            case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                    return getComponentNameFromType(type(innerType));
                } catch (x) {}
        }
        return null;
    }
    function testStringCoercion(value) {
        return "" + value;
    }
    function checkKeyStringCoercion(value) {
        try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
        } catch (e) {
            JSCompiler_inline_result = !0;
        }
        if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
            return testStringCoercion(value);
        }
    }
    function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
        try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
        } catch (x) {
            return "<...>";
        }
    }
    function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
        return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return !1;
        }
        return void 0 !== config.key;
    }
    function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
        }
        warnAboutAccessingKey.isReactWarning = !0;
        Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: !0
        });
    }
    function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
    }
    function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: type,
            key: key,
            props: props,
            _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: !1,
            get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", {
            enumerable: !1,
            value: null
        });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: null
        });
        Object.defineProperty(type, "_debugStack", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
    }
    function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children) if (isStaticChildren) if (isArrayImpl(children)) {
            for(isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)validateChildKeys(children[isStaticChildren]);
            Object.freeze && Object.freeze(children);
        } else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
        else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
                return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = !0);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
            maybeKey = {};
            for(var propName in config)"key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(maybeKey, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
        return ReactElement(type, children, maybeKey, getOwner(), debugStack, debugTask);
    }
    function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
    }
    function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    var React = __turbopack_context__.r("[project]/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
    };
    React = {
        react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
        }
    };
    var specialPropKeyWarningShown;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(React, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutKeySpread = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsxDEV = function(type, config, maybeKey, isStaticChildren) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error("react-stack-top-frame");
            Error.stackTraceLimit = previousStackTraceLimit;
        } else debugStackDEV = unknownOwnerDebugStack;
        return jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStackDEV, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
}();
}),
"[project]/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/frontend/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = __turbopack_context__.r("[project]/frontend/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)");
}
}),
"[project]/frontend/node_modules/next/navigation.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = __turbopack_context__.r("[project]/frontend/node_modules/next/dist/client/components/navigation.js [app-client] (ecmascript)");
}),
]);

//# sourceMappingURL=frontend_a38e9c49._.js.map