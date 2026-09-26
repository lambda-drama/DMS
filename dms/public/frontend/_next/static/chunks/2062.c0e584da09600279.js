"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[2062],
	{
		12651: (e, r, t) => {
			t.d(r, { A: () => a });
			let a = (0, t(90425).A)("circle-check", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }],
			]);
		},
		13545: (e, r, t) => {
			t.d(r, { A: () => a });
			let a = (0, t(90425).A)("circle-alert", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
				["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }],
			]);
		},
		36241: (e, r, t) => {
			t.r(r), t.d(r, { default: () => f });
			var a = t(95155),
				n = t(12115),
				o = t(44855),
				s = t(32144),
				i = t(55833),
				l = t(4474),
				c = t(42074),
				u = t(32079),
				d = t(93108),
				m = t(6296);
			function f() {
				let { navigate: e } = (0, i.c)(),
					{ data: r } = (0, o.Ay)("crm-lead-form-options", s.Fl),
					[t, f] = (0, n.useState)(!1),
					{ error: p, success: v, showError: b, clear: h } = (0, d.B)(),
					[y, x] = (0, n.useState)(u.Sp);
				(0, n.useEffect)(() => {
					r &&
						x((e) => ({
							...e,
							company: e.company || r.default_company || "",
							source: e.source || r.sources?.[0] || "Showroom Walk-in",
						}));
				}, [r]);
				let w = async () => {
					if ((h(), !y.lead_name.trim() && !y.first_name.trim() && !y.mobile_no.trim()))
						return void b("Enter a lead name, first name, or mobile number.");
					if (!y.source) return void b("Lead source is required.");
					f(!0);
					try {
						let r = await (0, s.tR)((0, u.DW)(y));
						r?.name ? e("crm-lead-detail", { id: r.name }) : e("crm-leads");
					} catch (e) {
						b(e, "Failed to create lead");
					} finally {
						f(!1);
					}
				};
				return (0, a.jsxs)("div", {
					className: "dms-form-page space-y-4",
					children: [
						(0, a.jsx)(d.y, { error: p, success: v, onDismiss: h }),
						(0, a.jsx)(u.Rs, { form: y, setForm: x, options: r, showStatus: !0 }),
						(0, a.jsxs)(c.h, {
							children: [
								(0, a.jsx)(l.$, {
									variant: "outline",
									onClick: () => e("crm-leads"),
									disabled: t,
									children: "Cancel",
								}),
								(0, a.jsxs)(l.$, {
									onClick: w,
									disabled: t,
									children: [
										t
											? (0, a.jsx)(m.A, {
													className: "mr-2 h-4 w-4 animate-spin",
											  })
											: null,
										"Save Lead",
									],
								}),
							],
						}),
					],
				});
			}
		},
		57518: (e, r, t) => {
			t.d(r, { B8: () => S, UC: () => K, bL: () => D, l9: () => I });
			var a = t(12115),
				n = t(70379),
				o = t(68599),
				s = t(83478),
				i = t(83935),
				l = t(99354),
				c = t(1933),
				u = t(98979),
				d = t(89971),
				m = t(95155),
				f = "Tabs",
				[p, v] = (0, o.A)(f, [s.RG]),
				b = (0, s.RG)(),
				[h, y] = p(f),
				x = a.forwardRef((e, r) => {
					let {
							__scopeTabs: t,
							value: a,
							onValueChange: n,
							defaultValue: o,
							orientation: s = "horizontal",
							dir: i,
							activationMode: p = "automatic",
							...v
						} = e,
						b = (0, c.jH)(i),
						[y, x] = (0, u.i)({
							prop: a,
							onChange: n,
							defaultProp: o ?? "",
							caller: f,
						});
					return (0, m.jsx)(h, {
						scope: t,
						baseId: (0, d.B)(),
						value: y,
						onValueChange: x,
						orientation: s,
						dir: b,
						activationMode: p,
						children: (0, m.jsx)(l.sG.div, {
							dir: b,
							"data-orientation": s,
							...v,
							ref: r,
						}),
					});
				});
			x.displayName = f;
			var w = "TabsList",
				g = a.forwardRef((e, r) => {
					let { __scopeTabs: t, loop: a = !0, ...n } = e,
						o = y(w, t),
						i = b(t);
					return (0, m.jsx)(s.bL, {
						asChild: !0,
						...i,
						orientation: o.orientation,
						dir: o.dir,
						loop: a,
						children: (0, m.jsx)(l.sG.div, {
							role: "tablist",
							"aria-orientation": o.orientation,
							...n,
							ref: r,
						}),
					});
				});
			g.displayName = w;
			var j = "TabsTrigger",
				k = a.forwardRef((e, r) => {
					let { __scopeTabs: t, value: a, disabled: o = !1, ...i } = e,
						c = y(j, t),
						u = b(t),
						d = R(c.baseId, a),
						f = F(c.baseId, a),
						p = a === c.value;
					return (0, m.jsx)(s.q7, {
						asChild: !0,
						...u,
						focusable: !o,
						active: p,
						children: (0, m.jsx)(l.sG.button, {
							type: "button",
							role: "tab",
							"aria-selected": p,
							"aria-controls": f,
							"data-state": p ? "active" : "inactive",
							"data-disabled": o ? "" : void 0,
							disabled: o,
							id: d,
							...i,
							ref: r,
							onMouseDown: (0, n.mK)(e.onMouseDown, (e) => {
								o || 0 !== e.button || !1 !== e.ctrlKey
									? e.preventDefault()
									: c.onValueChange(a);
							}),
							onKeyDown: (0, n.mK)(e.onKeyDown, (e) => {
								[" ", "Enter"].includes(e.key) && c.onValueChange(a);
							}),
							onFocus: (0, n.mK)(e.onFocus, () => {
								let e = "manual" !== c.activationMode;
								p || o || !e || c.onValueChange(a);
							}),
						}),
					});
				});
			k.displayName = j;
			var A = "TabsContent",
				C = a.forwardRef((e, r) => {
					let { __scopeTabs: t, value: n, forceMount: o, children: s, ...c } = e,
						u = y(A, t),
						d = R(u.baseId, n),
						f = F(u.baseId, n),
						p = n === u.value,
						v = a.useRef(p);
					return (
						a.useEffect(() => {
							let e = requestAnimationFrame(() => (v.current = !1));
							return () => cancelAnimationFrame(e);
						}, []),
						(0, m.jsx)(i.C, {
							present: o || p,
							children: ({ present: t }) =>
								(0, m.jsx)(l.sG.div, {
									"data-state": p ? "active" : "inactive",
									"data-orientation": u.orientation,
									role: "tabpanel",
									"aria-labelledby": d,
									hidden: !t,
									id: f,
									tabIndex: 0,
									...c,
									ref: r,
									style: {
										...e.style,
										animationDuration: v.current ? "0s" : void 0,
									},
									children: t && s,
								}),
						})
					);
				});
			function R(e, r) {
				return `${e}-trigger-${r}`;
			}
			function F(e, r) {
				return `${e}-content-${r}`;
			}
			C.displayName = A;
			var D = x,
				S = g,
				I = k,
				K = C;
		},
		83478: (e, r, t) => {
			t.d(r, { RG: () => g, bL: () => I, q7: () => K });
			var a = t(12115),
				n = t(70379),
				o = t(64831),
				s = t(47527),
				i = t(68599),
				l = t(89971),
				c = t(99354),
				u = t(17347),
				d = t(98979),
				m = t(1933),
				f = t(95155),
				p = "rovingFocusGroup.onEntryFocus",
				v = { bubbles: !1, cancelable: !0 },
				b = "RovingFocusGroup",
				[h, y, x] = (0, o.N)(b),
				[w, g] = (0, i.A)(b, [x]),
				[j, k] = w(b),
				A = a.forwardRef((e, r) =>
					(0, f.jsx)(h.Provider, {
						scope: e.__scopeRovingFocusGroup,
						children: (0, f.jsx)(h.Slot, {
							scope: e.__scopeRovingFocusGroup,
							children: (0, f.jsx)(C, { ...e, ref: r }),
						}),
					})
				);
			A.displayName = b;
			var C = a.forwardRef((e, r) => {
					let {
							__scopeRovingFocusGroup: t,
							orientation: o,
							loop: i = !1,
							dir: l,
							currentTabStopId: h,
							defaultCurrentTabStopId: x,
							onCurrentTabStopIdChange: w,
							onEntryFocus: g,
							preventScrollOnEntryFocus: k = !1,
							...A
						} = e,
						C = a.useRef(null),
						R = (0, s.s)(r, C),
						F = (0, m.jH)(l),
						[D, I] = (0, d.i)({
							prop: h,
							defaultProp: x ?? null,
							onChange: w,
							caller: b,
						}),
						[K, N] = a.useState(!1),
						E = (0, u.c)(g),
						T = y(t),
						G = a.useRef(!1),
						[L, _] = a.useState(0);
					return (
						a.useEffect(() => {
							let e = C.current;
							if (e)
								return e.addEventListener(p, E), () => e.removeEventListener(p, E);
						}, [E]),
						(0, f.jsx)(j, {
							scope: t,
							orientation: o,
							dir: F,
							loop: i,
							currentTabStopId: D,
							onItemFocus: a.useCallback((e) => I(e), [I]),
							onItemShiftTab: a.useCallback(() => N(!0), []),
							onFocusableItemAdd: a.useCallback(() => _((e) => e + 1), []),
							onFocusableItemRemove: a.useCallback(() => _((e) => e - 1), []),
							children: (0, f.jsx)(c.sG.div, {
								tabIndex: K || 0 === L ? -1 : 0,
								"data-orientation": o,
								...A,
								ref: R,
								style: { outline: "none", ...e.style },
								onMouseDown: (0, n.mK)(e.onMouseDown, () => {
									G.current = !0;
								}),
								onFocus: (0, n.mK)(e.onFocus, (e) => {
									let r = !G.current;
									if (e.target === e.currentTarget && r && !K) {
										let r = new CustomEvent(p, v);
										if (
											(e.currentTarget.dispatchEvent(r), !r.defaultPrevented)
										) {
											let e = T().filter((e) => e.focusable);
											S(
												[
													e.find((e) => e.active),
													e.find((e) => e.id === D),
													...e,
												]
													.filter(Boolean)
													.map((e) => e.ref.current),
												k
											);
										}
									}
									G.current = !1;
								}),
								onBlur: (0, n.mK)(e.onBlur, () => N(!1)),
							}),
						})
					);
				}),
				R = "RovingFocusGroupItem",
				F = a.forwardRef((e, r) => {
					let {
							__scopeRovingFocusGroup: t,
							focusable: o = !0,
							active: s = !1,
							tabStopId: i,
							children: u,
							...d
						} = e,
						m = (0, l.B)(),
						p = i || m,
						v = k(R, t),
						b = v.currentTabStopId === p,
						x = y(t),
						{
							onFocusableItemAdd: w,
							onFocusableItemRemove: g,
							currentTabStopId: j,
						} = v;
					return (
						a.useEffect(() => {
							if (o) return w(), () => g();
						}, [o, w, g]),
						(0, f.jsx)(h.ItemSlot, {
							scope: t,
							id: p,
							focusable: o,
							active: s,
							children: (0, f.jsx)(c.sG.span, {
								tabIndex: b ? 0 : -1,
								"data-orientation": v.orientation,
								...d,
								ref: r,
								onMouseDown: (0, n.mK)(e.onMouseDown, (e) => {
									o ? v.onItemFocus(p) : e.preventDefault();
								}),
								onFocus: (0, n.mK)(e.onFocus, () => v.onItemFocus(p)),
								onKeyDown: (0, n.mK)(e.onKeyDown, (e) => {
									if ("Tab" === e.key && e.shiftKey)
										return void v.onItemShiftTab();
									if (e.target !== e.currentTarget) return;
									let r = (function (e, r, t) {
										var a;
										let n =
											((a = e.key),
											"rtl" !== t
												? a
												: "ArrowLeft" === a
												? "ArrowRight"
												: "ArrowRight" === a
												? "ArrowLeft"
												: a);
										if (
											!(
												"vertical" === r &&
												["ArrowLeft", "ArrowRight"].includes(n)
											) &&
											!(
												"horizontal" === r &&
												["ArrowUp", "ArrowDown"].includes(n)
											)
										)
											return D[n];
									})(e, v.orientation, v.dir);
									if (void 0 !== r) {
										if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey)
											return;
										e.preventDefault();
										let n = x()
											.filter((e) => e.focusable)
											.map((e) => e.ref.current);
										if ("last" === r) n.reverse();
										else if ("prev" === r || "next" === r) {
											var t, a;
											"prev" === r && n.reverse();
											let o = n.indexOf(e.currentTarget);
											n = v.loop
												? ((t = n),
												  (a = o + 1),
												  t.map((e, r) => t[(a + r) % t.length]))
												: n.slice(o + 1);
										}
										setTimeout(() => S(n));
									}
								}),
								children:
									"function" == typeof u
										? u({ isCurrentTabStop: b, hasTabStop: null != j })
										: u,
							}),
						})
					);
				});
			F.displayName = R;
			var D = {
				ArrowLeft: "prev",
				ArrowUp: "prev",
				ArrowRight: "next",
				ArrowDown: "next",
				PageUp: "first",
				Home: "first",
				PageDown: "last",
				End: "last",
			};
			function S(e, r = !1) {
				let t = document.activeElement;
				for (let a of e)
					if (a === t || (a.focus({ preventScroll: r }), document.activeElement !== t))
						return;
			}
			var I = A,
				K = F;
		},
		93108: (e, r, t) => {
			t.d(r, { B: () => u, y: () => d });
			var a = t(95155),
				n = t(12115),
				o = t(66609),
				s = t(13545),
				i = t(12651),
				l = t(33210),
				c = t(91337);
			function u() {
				let [e, r] = (0, n.useState)(""),
					[t, a] = (0, n.useState)(""),
					s = (0, n.useCallback)((e, t = "Something went wrong.") => {
						let n =
							(e instanceof Error ? e.message : "string" == typeof e ? e : "")
								.replace(/<br\s*\/?>/gi, "\n")
								.replace(/<[^>]*>/g, "")
								.trim() || t;
						return (
							a(""),
							r(n),
							o.o.error(n, { duration: 8e3 }),
							"u" > typeof document &&
								document
									.querySelector("main")
									?.scrollTo({ top: 0, behavior: "smooth" }),
							n
						);
					}, []);
				return {
					error: e,
					success: t,
					showError: s,
					showSuccess: (0, n.useCallback)((e) => {
						r(""), a(e), o.o.success(e);
					}, []),
					clear: (0, n.useCallback)(() => {
						r(""), a("");
					}, []),
				};
			}
			function d({ error: e, success: r, onDismiss: t, className: n }) {
				if (!e && !r) return null;
				let o = !!e;
				return (0, a.jsx)("div", {
					className: (0, c.cn)("sticky top-0 z-40 -mx-1 px-1 pt-1", n),
					children: (0, a.jsxs)("div", {
						role: o ? "alert" : "status",
						"aria-live": o ? "assertive" : "polite",
						className: (0, c.cn)(
							"flex items-start gap-2 rounded-xl border p-3 text-sm shadow-sm backdrop-blur",
							o
								? "border-destructive/40 bg-destructive/10 text-destructive"
								: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
						),
						children: [
							o
								? (0, a.jsx)(s.A, { className: "mt-0.5 h-4 w-4 shrink-0" })
								: (0, a.jsx)(i.A, { className: "mt-0.5 h-4 w-4 shrink-0" }),
							(0, a.jsx)("p", {
								className: "flex-1 whitespace-pre-wrap break-words",
								children: e || r,
							}),
							t
								? (0, a.jsx)("button", {
										type: "button",
										onClick: t,
										"aria-label": "Dismiss message",
										className:
											"rounded p-0.5 opacity-70 transition-opacity hover:opacity-100",
										children: (0, a.jsx)(l.A, { className: "h-4 w-4" }),
								  })
								: null,
						],
					}),
				});
			}
		},
	},
]);
