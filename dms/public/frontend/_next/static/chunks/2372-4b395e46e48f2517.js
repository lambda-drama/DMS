"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[2372],
	{
		4474: (e, t, r) => {
			r.d(t, { $: () => l, r: () => a });
			var n = r(95155);
			r(12115);
			var o = r(42442),
				s = r(18460),
				i = r(91337);
			let a = (0, s.F)(
				"inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium tracking-tight transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.98]",
				{
					variants: {
						variant: {
							default:
								"bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(30,136,229,0.28)] hover:brightness-105",
							destructive:
								"bg-destructive text-white shadow-[0_2px_8px_rgba(211,47,47,0.22)] hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
							outline:
								"border border-border bg-card text-foreground shadow-none hover:bg-muted",
							secondary:
								"bg-secondary text-secondary-foreground shadow-[0_2px_8px_rgba(15,61,94,0.2)] hover:bg-secondary/90",
							ghost: "hover:bg-muted hover:text-foreground",
							link: "text-primary underline-offset-4 hover:underline",
						},
						size: {
							default: "h-9 px-4 py-2 has-[>svg]:px-3",
							sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
							lg: "h-10 px-6 has-[>svg]:px-4",
							icon: "size-9",
							"icon-sm": "size-8",
							"icon-lg": "size-10",
						},
					},
					defaultVariants: { variant: "default", size: "default" },
				}
			);
			function l({ className: e, variant: t, size: r, asChild: s = !1, ...u }) {
				let c = s ? o.DX : "button";
				return (0, n.jsx)(c, {
					"data-slot": "button",
					className: (0, i.cn)(a({ variant: t, size: r, className: e })),
					...u,
				});
			}
		},
		10086: (e, t, r) => {
			r.d(t, { JM: () => p, Zi: () => g });
			var n = r(95155),
				o = r(12115),
				s = r(47650),
				i = r(39658),
				a = r(91337),
				l = r(6296),
				u = r(94514),
				c = r(33210),
				d = r(51914),
				f = r(56563);
			let m = "data-searchable-select-dropdown";
			function p(e) {
				return e instanceof Element && !!e.closest(`[${m}]`);
			}
			function g({
				options: e,
				value: t,
				onValueChange: r,
				onSearchChange: p,
				placeholder: v = "Search...",
				emptyMessage: h = "No results found",
				isLoading: b = !1,
				disabled: x = !1,
				className: w,
				portaled: y = !1,
				onCreateNew: k,
				createNewLabel: j = "Create new",
				valueLabel: _,
				keepOpenOnSelect: E = !1,
			}) {
				let [N, S] = (0, o.useState)(!1),
					[C, A] = (0, o.useState)(""),
					[D, P] = (0, o.useState)(-1),
					[T, L] = (0, o.useState)({}),
					z = (0, o.useRef)(null),
					R = (0, o.useRef)(null),
					F = (0, o.useRef)(null),
					G = (0, o.useRef)(null),
					$ = e.find((e) => e.value === t),
					q = $?.label || (t && _ ? _ : ""),
					J =
						p || !C
							? e
							: e.filter(
									(e) =>
										e.label.toLowerCase().includes(C.toLowerCase()) ||
										e.value.toLowerCase().includes(C.toLowerCase()) ||
										(e.description?.toLowerCase().includes(C.toLowerCase()) ??
											!1)
							  ),
					O = (0, o.useCallback)(() => {
						if (!y || !F.current) return;
						let e = F.current.getBoundingClientRect();
						L({
							position: "fixed",
							top: e.bottom + 4,
							left: e.left,
							width: e.width,
							zIndex: 300,
						});
					}, [y]);
				(0, o.useEffect)(() => {
					function e(e) {
						let t = e.target;
						z.current?.contains(t) || R.current?.contains(t) || S(!1);
					}
					return (
						document.addEventListener("mousedown", e),
						() => document.removeEventListener("mousedown", e)
					);
				}, []),
					(0, o.useEffect)(() => {
						P(-1);
					}, [C, N]),
					(0, o.useEffect)(() => {
						if (N && y)
							return (
								O(),
								window.addEventListener("resize", O),
								window.addEventListener("scroll", O, !0),
								() => {
									window.removeEventListener("resize", O),
										window.removeEventListener("scroll", O, !0);
								}
							);
					}, [N, y, C, e.length, O]);
				let I = (0, o.useCallback)(
						(e) => {
							A(e), p?.(e);
						},
						[p]
					),
					B = (0, o.useCallback)(
						(e) => {
							if ((r(e.value), A(""), p?.(""), E)) {
								S(!0),
									requestAnimationFrame(() => {
										F.current?.focus(), O();
									});
								return;
							}
							S(!1);
						},
						[r, p, E, O]
					),
					M = (0, o.useCallback)(() => {
						r(""), A(""), I(""), S(!1), F.current?.focus();
					}, [r, I]);
				(0, o.useEffect)(() => {
					if (D >= 0 && G.current) {
						let e = G.current.children[D];
						e?.scrollIntoView({ block: "nearest" });
					}
				}, [D]);
				let U = !!k && !x,
					V = U
						? t
							? "pr-[7.5rem] sm:pr-[5.25rem]"
							: "pr-24 sm:pr-20"
						: t
						? "pr-24 sm:pr-16"
						: "pr-12 sm:pr-10",
					X = (0, n.jsx)("div", {
						ref: R,
						[m]: "",
						className: (0, a.cn)(
							"rounded-md border border-(--dms-green)/30 bg-popover shadow-lg",
							y ? "pointer-events-auto" : "absolute z-50 mt-1 w-full"
						),
						style: y ? T : void 0,
						onPointerDown: (e) => e.stopPropagation(),
						children: (0, n.jsx)("div", {
							ref: G,
							className:
								"max-h-60 overflow-y-auto overscroll-contain p-1 touch-pan-y",
							onWheel: (e) => e.stopPropagation(),
							onTouchMove: (e) => e.stopPropagation(),
							children: b
								? (0, n.jsxs)("div", {
										className:
											"flex items-center justify-center py-4 text-sm text-muted-foreground",
										children: [
											(0, n.jsx)(l.A, {
												className: "h-4 w-4 animate-spin mr-2",
											}),
											"Loading...",
										],
								  })
								: 0 === J.length
								? (0, n.jsx)("div", {
										className:
											"py-4 text-center text-sm text-muted-foreground",
										children: h,
								  })
								: J.map((e, r) =>
										(0, n.jsxs)(
											"button",
											{
												type: "button",
												onPointerDown: (t) => {
													t.preventDefault(), t.stopPropagation(), B(e);
												},
												className: (0, a.cn)(
													"flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer",
													"hover:bg-dms-green-light hover:text-foreground",
													D === r && "bg-dms-green-light",
													t === e.value && "font-medium text-dms-green"
												),
												children: [
													(0, n.jsx)(u.A, {
														className: (0, a.cn)(
															"h-3.5 w-3.5 shrink-0",
															t === e.value
																? "opacity-100 text-dms-green"
																: "opacity-0"
														),
													}),
													(0, n.jsxs)("div", {
														className:
															"flex flex-col items-start text-left min-w-0",
														children: [
															(0, n.jsx)("span", {
																className: "truncate",
																children: e.label,
															}),
															e.description &&
																(0, n.jsx)("span", {
																	className:
																		"text-xs text-muted-foreground truncate",
																	children: e.description,
																}),
														],
													}),
												],
											},
											e.value
										)
								  ),
						}),
					});
				return (0, n.jsxs)("div", {
					ref: z,
					className: (0, a.cn)("relative", w),
					children: [
						(0, n.jsxs)("div", {
							className: "relative",
							children: [
								(0, n.jsx)(i.p, {
									ref: F,
									placeholder: q || v,
									value: N ? C : q,
									onChange: (e) => {
										I(e.target.value), N || S(!0);
									},
									onFocus: () => {
										S(!0), $ && !E && A(""), y && O();
									},
									onClick: () => {
										!N && (S(!0), y && O());
									},
									onKeyDown: (e) => {
										"ArrowDown" === e.key
											? (e.preventDefault(),
											  P((e) => (e < J.length - 1 ? e + 1 : e)))
											: "ArrowUp" === e.key
											? (e.preventDefault(), P((e) => (e > 0 ? e - 1 : e)))
											: "Enter" === e.key && D >= 0
											? (e.preventDefault(), B(J[D]))
											: "Escape" === e.key && S(!1);
									},
									disabled: x,
									className: (0, a.cn)(
										V,
										"transition-colors",
										!N && $ && "text-foreground",
										N && "border-dms-green ring-1 ring-dms-green"
									),
								}),
								(0, n.jsxs)("div", {
									className:
										"absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5",
									children: [
										t &&
											(0, n.jsx)("button", {
												type: "button",
												onPointerDown: (e) => {
													e.preventDefault(), e.stopPropagation(), M();
												},
												onClick: (e) => {
													e.preventDefault(), e.stopPropagation();
												},
												className:
													"flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground touch-manipulation sm:h-7 sm:w-7",
												tabIndex: -1,
												"aria-label": "Clear selection",
												children: (0, n.jsx)(c.A, {
													className: "h-4 w-4 sm:h-3.5 sm:w-3.5",
												}),
											}),
										U &&
											(0, n.jsx)("button", {
												type: "button",
												onPointerDown: (e) => {
													e.preventDefault(),
														e.stopPropagation(),
														S(!1),
														k?.();
												},
												onClick: (e) => {
													e.preventDefault(), e.stopPropagation();
												},
												className:
													"flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted text-dms-green hover:text-dms-green touch-manipulation sm:h-7 sm:w-7",
												tabIndex: -1,
												"aria-label": j,
												title: j,
												children: (0, n.jsx)(d.A, {
													className:
														"h-4 w-4 stroke-[2.5] sm:h-3.5 sm:w-3.5",
												}),
											}),
										(0, n.jsx)("button", {
											type: "button",
											onPointerDown: (e) => {
												e.preventDefault(),
													e.stopPropagation(),
													S(!N),
													N || F.current?.focus();
											},
											onClick: (e) => {
												e.preventDefault(), e.stopPropagation();
											},
											className:
												"flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted text-muted-foreground touch-manipulation sm:h-7 sm:w-7",
											tabIndex: -1,
											"aria-label": "Toggle options",
											children: (0, n.jsx)(f.A, {
												className: "h-4 w-4 sm:h-3.5 sm:w-3.5",
											}),
										}),
									],
								}),
							],
						}),
						N &&
							(y && "u" > typeof document
								? (0, s.createPortal)(X, document.body)
								: X),
					],
				});
			}
		},
		39658: (e, t, r) => {
			r.d(t, { p: () => s });
			var n = r(95155);
			r(12115);
			var o = r(91337);
			function s({ className: e, type: t, ...r }) {
				return (0, n.jsx)("input", {
					type: t,
					"data-slot": "input",
					className: (0, o.cn)(
						"file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-full border bg-transparent px-4 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
						"focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 focus-visible:ring-[3px]",
						"aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
						e
					),
					...r,
				});
			}
		},
		49876: (e, t, r) => {
			r.d(t, { AT: () => u, bd: () => s, w$: () => i });
			let n = null;
			function o(e) {
				if (!e || "string" != typeof e) return !1;
				let t = e.trim();
				return !(!t || t.includes("{{") || t.includes("}}"));
			}
			async function s(e = !1) {
				let t = window;
				if (!e) {
					if (o(t?.csrf_token)) return t.csrf_token.trim();
					let e = (function () {
						if ("u" < typeof document) return null;
						let e = document.querySelector('meta[name="csrf-token"]'),
							t = e?.getAttribute("content");
						return o(t) ? t.trim() : null;
					})();
					if (e) return t && (t.csrf_token = e), e;
				}
				return (
					n ||
					(n = (async () => {
						try {
							let t = await fetch("/api/method/dms.api.common.get_csrf_token", {
									method: "GET",
									credentials: "include",
									headers: { Accept: "application/json" },
								}),
								r = await t.json().catch(() => ({})),
								n = r?.message ?? null;
							if (o(n)) {
								var e;
								let t;
								return (
									(e = n.trim()),
									(t = window) && (t.csrf_token = e),
									(function (e) {
										if ("u" < typeof document) return;
										let t = document.querySelector('meta[name="csrf-token"]');
										t ||
											((t = document.createElement("meta")).setAttribute(
												"name",
												"csrf-token"
											),
											document.head.appendChild(t)),
											t.setAttribute("content", e);
									})(e),
									n.trim()
								);
							}
							return null;
						} catch {
							return null;
						} finally {
							n = null;
						}
					})())
				);
			}
			function i() {
				let e = window;
				if ((e && delete e.csrf_token, "u" > typeof document)) {
					let e = document.querySelector('meta[name="csrf-token"]');
					e?.setAttribute("content", "");
				}
			}
			function a() {
				let e = window,
					t = e?.csrf_token;
				return o(t) ? t.trim() : null;
			}
			function l(e) {
				return e
					.replace(/<br\s*\/?>/gi, "\n")
					.replace(/<\/(p|div|li)>/gi, "\n")
					.replace(/<[^>]*>/g, "")
					.replace(/&nbsp;/g, " ")
					.replace(/&amp;/g, "&")
					.replace(/&lt;/g, "<")
					.replace(/&gt;/g, ">")
					.replace(/&quot;/g, '"')
					.replace(/&#39;/g, "'")
					.replace(/\n{3,}/g, "\n\n")
					.trim();
			}
			async function u(e, t = {}) {
				var r;
				let n = t.method?.toUpperCase() || "GET",
					o = async (r) => {
						"GET" !== n && (await s(r));
						let o = (function (e, t) {
								let r = { ...e };
								if (!t) return r;
								if (t instanceof Headers)
									return (
										t.forEach((e, t) => {
											r[t] = e;
										}),
										r
									);
								if (Array.isArray(t)) {
									for (let [e, n] of t) r[e] = n;
									return r;
								}
								return Object.assign(r, t), r;
							})(
								(function (e) {
									let t = {
										"Content-Type": "application/json",
										Accept: "application/json",
									};
									if ("GET" !== e) {
										let e = a();
										e && (t["X-Frappe-CSRF-Token"] = e);
									}
									return t;
								})(n),
								t.headers
							),
							i = "GET" !== n ? a() : null,
							l =
								"GET" !== n
									? (function (e, t) {
											if (!t || null == e || "string" != typeof e) return e;
											try {
												let r = JSON.parse(e);
												if (
													null !== r &&
													"object" == typeof r &&
													!Array.isArray(r)
												)
													return JSON.stringify({ ...r, csrf_token: t });
											} catch {}
											return e;
									  })(t.body ?? null, i)
									: t.body,
							u = await fetch(e, {
								...t,
								headers: o,
								body: l ?? t.body,
								credentials: "include",
							}),
							c = await u.json().catch(() => ({}));
						return { response: u, resData: c };
					},
					{ response: c, resData: d } = await o(!1);
				if (
					(!c.ok &&
						"GET" !== n &&
						(403 === c.status ||
							(400 === c.status &&
								("CSRFTokenError" === (r = d).exc_type ||
									String(r.exc ?? "").includes("CSRFTokenError")))) &&
						(i(), ({ response: c, resData: d } = await o(!0))),
					!c.ok)
				)
					throw Error(
						(function (e) {
							if (e._server_messages) {
								let t = (function (e) {
									try {
										let t = JSON.parse(String(e));
										if (!Array.isArray(t)) return l(String(e));
										return t
											.map((e) => {
												try {
													return (
														JSON.parse(String(e)).message ?? String(e)
													);
												} catch {
													return String(e);
												}
											})
											.map(l)
											.filter(Boolean)
											.join("\n");
									} catch {
										return l(String(e));
									}
								})(e._server_messages);
								if (t) return t;
							}
							if ("string" == typeof e.message && e.message.trim())
								return l(e.message);
							let t = (function (e) {
								let t = String(e ?? "");
								try {
									let e = JSON.parse(t);
									Array.isArray(e)
										? (t = e.map((e) => String(e)).join("\n"))
										: "string" == typeof e && (t = e);
								} catch {}
								let r = l(t);
								if (!r) return "";
								let n = r.split("\n").filter(Boolean),
									o = n[n.length - 1] || "",
									s = o.match(
										/^[\w.]*(?:Error|Exception|DoesNotExistError):\s*(.+)$/
									);
								return s ? s[1].trim() : o.trim();
							})(e.exception || e.exc);
							return (
								t ||
								(e.exc_type
									? String(e.exc_type)
									: e.message
									? String(e.message)
									: "Request failed")
							);
						})(d)
					);
				return void 0 !== d.data ? d.data : void 0 !== d.message ? d.message : d;
			}
		},
		91337: (e, t, r) => {
			r.d(t, { cn: () => s, w: () => i });
			var n = r(29722),
				o = r(622);
			function s(...e) {
				return (0, o.QP)((0, n.$)(e));
			}
			function i(e) {
				var t, r;
				let n, o;
				return {
					primary: (e.vin || "").trim() || "—",
					secondary:
						((t = e.model),
						(r = e.license),
						(n = (t || "").trim()),
						(o = (r || "").trim()),
						n && o ? `${n} (${o})` : n || o),
				};
			}
		},
	},
]);
