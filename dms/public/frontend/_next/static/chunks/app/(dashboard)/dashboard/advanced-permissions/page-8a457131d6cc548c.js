(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[4885],
	{
		41015: (t, e, a) => {
			"use strict";
			a.d(e, {
				JK: () => o,
				TK: () => d,
				ec: () => l,
				im: () => c,
				kg: () => r,
				ly: () => i,
			});
			var s = a(49876);
			let n = "dms.api.users";
			async function o() {
				return (0, s.AT)(`/api/method/${n}.get_users_bootstrap`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
			async function r(t) {
				return (0, s.AT)(`/api/method/${n}.create_user`, {
					method: "POST",
					body: JSON.stringify({ data: t }),
				});
			}
			async function d(t) {
				return (0, s.AT)(`/api/method/${n}.update_user`, {
					method: "POST",
					body: JSON.stringify({ data: t }),
				});
			}
			async function i(t) {
				return (0, s.AT)(`/api/method/${n}.set_user_password`, {
					method: "POST",
					body: JSON.stringify(t),
				});
			}
			async function l(t) {
				return (0, s.AT)(`/api/method/${n}.change_password`, {
					method: "POST",
					body: JSON.stringify(t),
				});
			}
			async function c() {
				return (0, s.AT)(`/api/method/${n}.get_password_status`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
		},
		74350: (t, e, a) => {
			"use strict";
			a.d(e, {
				Cf: () => u,
				Es: () => g,
				L3: () => p,
				c7: () => f,
				lG: () => i,
				rr: () => m,
			});
			var s = a(95155);
			a(12115);
			var n = a(29483),
				o = a(33210),
				r = a(91337),
				d = a(10086);
			function i({ ...t }) {
				return (0, s.jsx)(n.bL, { "data-slot": "dialog", ...t });
			}
			function l({ ...t }) {
				return (0, s.jsx)(n.ZL, { "data-slot": "dialog-portal", ...t });
			}
			function c({ className: t, ...e }) {
				return (0, s.jsx)(n.hJ, {
					"data-slot": "dialog-overlay",
					className: (0, r.cn)(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
						t
					),
					...e,
				});
			}
			function u({
				className: t,
				children: e,
				showCloseButton: a = !0,
				headerActions: i,
				onPointerDownOutside: f,
				onInteractOutside: g,
				onFocusOutside: p,
				...m
			}) {
				return (0, s.jsxs)(l, {
					"data-slot": "dialog-portal",
					children: [
						(0, s.jsx)(c, {}),
						(0, s.jsxs)(n.UC, {
							"data-slot": "dialog-content",
							className: (0, r.cn)(
								"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
								t
							),
							onPointerDownOutside: (t) => {
								(0, d.JM)(t.target) ? t.preventDefault() : f?.(t);
							},
							onInteractOutside: (t) => {
								(0, d.JM)(t.target) ? t.preventDefault() : g?.(t);
							},
							onFocusOutside: (t) => {
								(0, d.JM)(t.target) ? t.preventDefault() : p?.(t);
							},
							...m,
							children: [
								e,
								(i || a) &&
									(0, s.jsxs)("div", {
										className:
											"absolute top-4 right-4 flex items-center gap-1",
										children: [
											i,
											a &&
												(0, s.jsxs)(n.bm, {
													"data-slot": "dialog-close",
													className:
														"ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
													children: [
														(0, s.jsx)(o.A, {}),
														(0, s.jsx)("span", {
															className: "sr-only",
															children: "Close",
														}),
													],
												}),
										],
									}),
							],
						}),
					],
				});
			}
			function f({ className: t, ...e }) {
				return (0, s.jsx)("div", {
					"data-slot": "dialog-header",
					className: (0, r.cn)("flex flex-col gap-2 text-center sm:text-left", t),
					...e,
				});
			}
			function g({ className: t, ...e }) {
				return (0, s.jsx)("div", {
					"data-slot": "dialog-footer",
					className: (0, r.cn)(
						"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
						t
					),
					...e,
				});
			}
			function p({ className: t, ...e }) {
				return (0, s.jsx)(n.hE, {
					"data-slot": "dialog-title",
					className: (0, r.cn)("text-lg leading-none font-semibold", t),
					...e,
				});
			}
			function m({ className: t, ...e }) {
				return (0, s.jsx)(n.VY, {
					"data-slot": "dialog-description",
					className: (0, r.cn)("text-muted-foreground text-sm", t),
					...e,
				});
			}
		},
		79792: (t, e, a) => {
			"use strict";
			a.d(e, { J: () => r });
			var s = a(95155);
			a(12115);
			var n = a(91760),
				o = a(91337);
			function r({ className: t, ...e }) {
				return (0, s.jsx)(n.b, {
					"data-slot": "label",
					className: (0, o.cn)(
						"flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
						t
					),
					...e,
				});
			}
		},
		86385: (t, e, a) => {
			Promise.resolve().then(a.bind(a, 23826));
		},
	},
	(t) => {
		t.O(
			0,
			[
				5139, 878, 8409, 4855, 454, 6609, 410, 7605, 1602, 2074, 2372, 5328, 3826, 8441,
				3794, 7358,
			],
			() => t((t.s = 86385))
		),
			(_N_E = t.O());
	},
]);
