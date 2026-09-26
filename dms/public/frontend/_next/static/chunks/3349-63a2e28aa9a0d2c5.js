"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[3349],
	{
		55243: (e, r, t) => {
			t.d(r, { A: () => n });
			let n = (0, t(90425).A)("save", [
				[
					"path",
					{
						d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
						key: "1c8476",
					},
				],
				["path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7", key: "1ydtos" }],
				["path", { d: "M7 3v4a1 1 0 0 0 1 1h7", key: "t51u73" }],
			]);
		},
		57518: (e, r, t) => {
			t.d(r, { B8: () => K, UC: () => j, bL: () => I, l9: () => M });
			var n = t(12115),
				a = t(70379),
				o = t(68599),
				i = t(83478),
				u = t(83935),
				s = t(99354),
				l = t(1933),
				c = t(98979),
				d = t(89971),
				f = t(95155),
				p = "Tabs",
				[v, h] = (0, o.A)(p, [i.RG]),
				m = (0, i.RG)(),
				[b, g] = v(p),
				w = n.forwardRef((e, r) => {
					let {
							__scopeTabs: t,
							value: n,
							onValueChange: a,
							defaultValue: o,
							orientation: i = "horizontal",
							dir: u,
							activationMode: v = "automatic",
							...h
						} = e,
						m = (0, l.jH)(u),
						[g, w] = (0, c.i)({
							prop: n,
							onChange: a,
							defaultProp: o ?? "",
							caller: p,
						});
					return (0, f.jsx)(b, {
						scope: t,
						baseId: (0, d.B)(),
						value: g,
						onValueChange: w,
						orientation: i,
						dir: m,
						activationMode: v,
						children: (0, f.jsx)(s.sG.div, {
							dir: m,
							"data-orientation": i,
							...h,
							ref: r,
						}),
					});
				});
			w.displayName = p;
			var y = "TabsList",
				R = n.forwardRef((e, r) => {
					let { __scopeTabs: t, loop: n = !0, ...a } = e,
						o = g(y, t),
						u = m(t);
					return (0, f.jsx)(i.bL, {
						asChild: !0,
						...u,
						orientation: o.orientation,
						dir: o.dir,
						loop: n,
						children: (0, f.jsx)(s.sG.div, {
							role: "tablist",
							"aria-orientation": o.orientation,
							...a,
							ref: r,
						}),
					});
				});
			R.displayName = y;
			var x = "TabsTrigger",
				C = n.forwardRef((e, r) => {
					let { __scopeTabs: t, value: n, disabled: o = !1, ...u } = e,
						l = g(x, t),
						c = m(t),
						d = k(l.baseId, n),
						p = F(l.baseId, n),
						v = n === l.value;
					return (0, f.jsx)(i.q7, {
						asChild: !0,
						...c,
						focusable: !o,
						active: v,
						children: (0, f.jsx)(s.sG.button, {
							type: "button",
							role: "tab",
							"aria-selected": v,
							"aria-controls": p,
							"data-state": v ? "active" : "inactive",
							"data-disabled": o ? "" : void 0,
							disabled: o,
							id: d,
							...u,
							ref: r,
							onMouseDown: (0, a.mK)(e.onMouseDown, (e) => {
								o || 0 !== e.button || !1 !== e.ctrlKey
									? e.preventDefault()
									: l.onValueChange(n);
							}),
							onKeyDown: (0, a.mK)(e.onKeyDown, (e) => {
								[" ", "Enter"].includes(e.key) && l.onValueChange(n);
							}),
							onFocus: (0, a.mK)(e.onFocus, () => {
								let e = "manual" !== l.activationMode;
								v || o || !e || l.onValueChange(n);
							}),
						}),
					});
				});
			C.displayName = x;
			var A = "TabsContent",
				E = n.forwardRef((e, r) => {
					let { __scopeTabs: t, value: a, forceMount: o, children: i, ...l } = e,
						c = g(A, t),
						d = k(c.baseId, a),
						p = F(c.baseId, a),
						v = a === c.value,
						h = n.useRef(v);
					return (
						n.useEffect(() => {
							let e = requestAnimationFrame(() => (h.current = !1));
							return () => cancelAnimationFrame(e);
						}, []),
						(0, f.jsx)(u.C, {
							present: o || v,
							children: ({ present: t }) =>
								(0, f.jsx)(s.sG.div, {
									"data-state": v ? "active" : "inactive",
									"data-orientation": c.orientation,
									role: "tabpanel",
									"aria-labelledby": d,
									hidden: !t,
									id: p,
									tabIndex: 0,
									...l,
									ref: r,
									style: {
										...e.style,
										animationDuration: h.current ? "0s" : void 0,
									},
									children: t && i,
								}),
						})
					);
				});
			function k(e, r) {
				return `${e}-trigger-${r}`;
			}
			function F(e, r) {
				return `${e}-content-${r}`;
			}
			E.displayName = A;
			var I = w,
				K = R,
				M = C,
				j = E;
		},
		60504: (e, r, t) => {
			t.d(r, { A: () => s });
			var n = t(12115),
				a = t(90901),
				o = t(44855),
				i = t(12180);
			let u = i.r
					? (e) => {
							e();
					  }
					: n.startTransition,
				s = (0, a.Ht)(o.Ay, () => (e, r, t = {}) => {
					let { mutate: o } = (0, a.iX)(),
						s = (0, n.useRef)(e),
						l = (0, n.useRef)(r),
						c = (0, n.useRef)(t),
						d = (0, n.useRef)(0),
						[f, p, v] = ((e) => {
							let [, r] = (0, n.useState)({}),
								t = (0, n.useRef)(!1),
								a = (0, n.useRef)(e),
								o = (0, n.useRef)({ data: !1, error: !1, isValidating: !1 }),
								u = (0, n.useCallback)((e) => {
									let n = !1,
										i = a.current;
									for (let r in e)
										Object.prototype.hasOwnProperty.call(e, r) &&
											i[r] !== e[r] &&
											((i[r] = e[r]), o.current[r] && (n = !0));
									n && !t.current && r({});
								}, []);
							return (
								(0, i.u)(
									() => (
										(t.current = !1),
										() => {
											t.current = !0;
										}
									)
								),
								[a, o.current, u]
							);
						})({ data: i.U, error: i.U, isMutating: !1 }),
						h = f.current,
						m = (0, n.useCallback)(async (e, r) => {
							let [t, n] = (0, i.s)(s.current);
							if (!l.current)
								throw Error("Can’t trigger the mutation: missing fetcher.");
							if (!t) throw Error("Can’t trigger the mutation: missing key.");
							let a = (0, i.m)(
									(0, i.m)({ populateCache: !1, throwOnError: !0 }, c.current),
									r
								),
								f = (0, i.o)();
							(d.current = f), v({ isMutating: !0 });
							try {
								let r = await o(
									t,
									l.current(n, { arg: e }),
									(0, i.m)(a, { throwOnError: !0 })
								);
								return (
									d.current <= f &&
										(u(() => v({ data: r, isMutating: !1, error: void 0 })),
										null == a.onSuccess || a.onSuccess.call(a, r, t, a)),
									r
								);
							} catch (e) {
								if (
									d.current <= f &&
									(u(() => v({ error: e, isMutating: !1 })),
									null == a.onError || a.onError.call(a, e, t, a),
									a.throwOnError)
								)
									throw e;
							}
						}, []),
						b = (0, n.useCallback)(() => {
							(d.current = (0, i.o)()), v({ data: i.U, error: i.U, isMutating: !1 });
						}, []);
					return (
						(0, i.u)(() => {
							(s.current = e), (l.current = r), (c.current = t);
						}),
						{
							trigger: m,
							reset: b,
							get data() {
								return (p.data = !0), h.data;
							},
							get error() {
								return (p.error = !0), h.error;
							},
							get isMutating() {
								return (p.isMutating = !0), h.isMutating;
							},
						}
					);
				});
		},
		80723: (e, r, t) => {
			t.d(r, { A: () => n });
			let n = (0, t(90425).A)("arrow-left", [
				["path", { d: "m12 19-7-7 7-7", key: "1l729n" }],
				["path", { d: "M19 12H5", key: "x3x0zl" }],
			]);
		},
		83478: (e, r, t) => {
			t.d(r, { RG: () => R, bL: () => M, q7: () => j });
			var n = t(12115),
				a = t(70379),
				o = t(64831),
				i = t(47527),
				u = t(68599),
				s = t(89971),
				l = t(99354),
				c = t(17347),
				d = t(98979),
				f = t(1933),
				p = t(95155),
				v = "rovingFocusGroup.onEntryFocus",
				h = { bubbles: !1, cancelable: !0 },
				m = "RovingFocusGroup",
				[b, g, w] = (0, o.N)(m),
				[y, R] = (0, u.A)(m, [w]),
				[x, C] = y(m),
				A = n.forwardRef((e, r) =>
					(0, p.jsx)(b.Provider, {
						scope: e.__scopeRovingFocusGroup,
						children: (0, p.jsx)(b.Slot, {
							scope: e.__scopeRovingFocusGroup,
							children: (0, p.jsx)(E, { ...e, ref: r }),
						}),
					})
				);
			A.displayName = m;
			var E = n.forwardRef((e, r) => {
					let {
							__scopeRovingFocusGroup: t,
							orientation: o,
							loop: u = !1,
							dir: s,
							currentTabStopId: b,
							defaultCurrentTabStopId: w,
							onCurrentTabStopIdChange: y,
							onEntryFocus: R,
							preventScrollOnEntryFocus: C = !1,
							...A
						} = e,
						E = n.useRef(null),
						k = (0, i.s)(r, E),
						F = (0, f.jH)(s),
						[I, M] = (0, d.i)({
							prop: b,
							defaultProp: w ?? null,
							onChange: y,
							caller: m,
						}),
						[j, D] = n.useState(!1),
						T = (0, c.c)(R),
						G = g(t),
						S = n.useRef(!1),
						[L, N] = n.useState(0);
					return (
						n.useEffect(() => {
							let e = E.current;
							if (e)
								return e.addEventListener(v, T), () => e.removeEventListener(v, T);
						}, [T]),
						(0, p.jsx)(x, {
							scope: t,
							orientation: o,
							dir: F,
							loop: u,
							currentTabStopId: I,
							onItemFocus: n.useCallback((e) => M(e), [M]),
							onItemShiftTab: n.useCallback(() => D(!0), []),
							onFocusableItemAdd: n.useCallback(() => N((e) => e + 1), []),
							onFocusableItemRemove: n.useCallback(() => N((e) => e - 1), []),
							children: (0, p.jsx)(l.sG.div, {
								tabIndex: j || 0 === L ? -1 : 0,
								"data-orientation": o,
								...A,
								ref: k,
								style: { outline: "none", ...e.style },
								onMouseDown: (0, a.mK)(e.onMouseDown, () => {
									S.current = !0;
								}),
								onFocus: (0, a.mK)(e.onFocus, (e) => {
									let r = !S.current;
									if (e.target === e.currentTarget && r && !j) {
										let r = new CustomEvent(v, h);
										if (
											(e.currentTarget.dispatchEvent(r), !r.defaultPrevented)
										) {
											let e = G().filter((e) => e.focusable);
											K(
												[
													e.find((e) => e.active),
													e.find((e) => e.id === I),
													...e,
												]
													.filter(Boolean)
													.map((e) => e.ref.current),
												C
											);
										}
									}
									S.current = !1;
								}),
								onBlur: (0, a.mK)(e.onBlur, () => D(!1)),
							}),
						})
					);
				}),
				k = "RovingFocusGroupItem",
				F = n.forwardRef((e, r) => {
					let {
							__scopeRovingFocusGroup: t,
							focusable: o = !0,
							active: i = !1,
							tabStopId: u,
							children: c,
							...d
						} = e,
						f = (0, s.B)(),
						v = u || f,
						h = C(k, t),
						m = h.currentTabStopId === v,
						w = g(t),
						{
							onFocusableItemAdd: y,
							onFocusableItemRemove: R,
							currentTabStopId: x,
						} = h;
					return (
						n.useEffect(() => {
							if (o) return y(), () => R();
						}, [o, y, R]),
						(0, p.jsx)(b.ItemSlot, {
							scope: t,
							id: v,
							focusable: o,
							active: i,
							children: (0, p.jsx)(l.sG.span, {
								tabIndex: m ? 0 : -1,
								"data-orientation": h.orientation,
								...d,
								ref: r,
								onMouseDown: (0, a.mK)(e.onMouseDown, (e) => {
									o ? h.onItemFocus(v) : e.preventDefault();
								}),
								onFocus: (0, a.mK)(e.onFocus, () => h.onItemFocus(v)),
								onKeyDown: (0, a.mK)(e.onKeyDown, (e) => {
									if ("Tab" === e.key && e.shiftKey)
										return void h.onItemShiftTab();
									if (e.target !== e.currentTarget) return;
									let r = (function (e, r, t) {
										var n;
										let a =
											((n = e.key),
											"rtl" !== t
												? n
												: "ArrowLeft" === n
												? "ArrowRight"
												: "ArrowRight" === n
												? "ArrowLeft"
												: n);
										if (
											!(
												"vertical" === r &&
												["ArrowLeft", "ArrowRight"].includes(a)
											) &&
											!(
												"horizontal" === r &&
												["ArrowUp", "ArrowDown"].includes(a)
											)
										)
											return I[a];
									})(e, h.orientation, h.dir);
									if (void 0 !== r) {
										if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey)
											return;
										e.preventDefault();
										let a = w()
											.filter((e) => e.focusable)
											.map((e) => e.ref.current);
										if ("last" === r) a.reverse();
										else if ("prev" === r || "next" === r) {
											var t, n;
											"prev" === r && a.reverse();
											let o = a.indexOf(e.currentTarget);
											a = h.loop
												? ((t = a),
												  (n = o + 1),
												  t.map((e, r) => t[(n + r) % t.length]))
												: a.slice(o + 1);
										}
										setTimeout(() => K(a));
									}
								}),
								children:
									"function" == typeof c
										? c({ isCurrentTabStop: m, hasTabStop: null != x })
										: c,
							}),
						})
					);
				});
			F.displayName = k;
			var I = {
				ArrowLeft: "prev",
				ArrowUp: "prev",
				ArrowRight: "next",
				ArrowDown: "next",
				PageUp: "first",
				Home: "first",
				PageDown: "last",
				End: "last",
			};
			function K(e, r = !1) {
				let t = document.activeElement;
				for (let n of e)
					if (n === t || (n.focus({ preventScroll: r }), document.activeElement !== t))
						return;
			}
			var M = A,
				j = F;
		},
	},
]);
