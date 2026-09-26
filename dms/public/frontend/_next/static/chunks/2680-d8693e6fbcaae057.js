"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[2680],
	{
		12651: (e, r, t) => {
			t.d(r, { A: () => a });
			let a = (0, t(90425).A)("circle-check", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }],
			]);
		},
		14636: (e, r, t) => {
			t.d(r, { A: () => a });
			let a = (0, t(90425).A)("car", [
				[
					"path",
					{
						d: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2",
						key: "5owen",
					},
				],
				["circle", { cx: "7", cy: "17", r: "2", key: "u2ysq9" }],
				["path", { d: "M9 17h6", key: "r8uit2" }],
				["circle", { cx: "17", cy: "17", r: "2", key: "axvx0g" }],
			]);
		},
		21053: (e, r, t) => {
			t.d(r, { A: () => a });
			let a = (0, t(90425).A)("truck", [
				[
					"path",
					{
						d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2",
						key: "wrbu53",
					},
				],
				["path", { d: "M15 18H9", key: "1lyqi6" }],
				[
					"path",
					{
						d: "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14",
						key: "lysw3i",
					},
				],
				["circle", { cx: "17", cy: "18", r: "2", key: "332jqn" }],
				["circle", { cx: "7", cy: "18", r: "2", key: "19iecd" }],
			]);
		},
		37618: (e, r, t) => {
			t.d(r, { A: () => a });
			let a = (0, t(90425).A)("pen-line", [
				["path", { d: "M13 21h8", key: "1jsn5i" }],
				[
					"path",
					{
						d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
						key: "1a8usu",
					},
				],
			]);
		},
		42869: (e, r, t) => {
			t.d(r, { A: () => a });
			let a = (0, t(90425).A)("user", [
				["path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", key: "975kel" }],
				["circle", { cx: "12", cy: "7", r: "4", key: "17ys0d" }],
			]);
		},
		47279: (e, r, t) => {
			t.d(r, { C1: () => M, bL: () => x });
			var a = t(12115),
				n = t(47527),
				i = t(68599),
				c = t(70379),
				l = t(98979),
				o = t(83417),
				u = t(63509),
				s = t(83935),
				d = t(99354),
				h = t(95155),
				p = "Checkbox",
				[y, f] = (0, i.A)(p),
				[k, v] = y(p);
			function m(e) {
				let {
						__scopeCheckbox: r,
						checked: t,
						children: n,
						defaultChecked: i,
						disabled: c,
						form: o,
						name: u,
						onCheckedChange: s,
						required: d,
						value: y = "on",
						internal_do_not_use_render: f,
					} = e,
					[v, m] = (0, l.i)({ prop: t, defaultProp: i ?? !1, onChange: s, caller: p }),
					[g, w] = a.useState(null),
					[x, b] = a.useState(null),
					M = a.useRef(!1),
					A = !g || !!o || !!g.closest("form"),
					C = {
						checked: v,
						disabled: c,
						setChecked: m,
						control: g,
						setControl: w,
						name: u,
						form: o,
						value: y,
						hasConsumerStoppedPropagationRef: M,
						required: d,
						defaultChecked: !E(i) && i,
						isFormControl: A,
						bubbleInput: x,
						setBubbleInput: b,
					};
				return (0, h.jsx)(k, {
					scope: r,
					...C,
					children: "function" == typeof f ? f(C) : n,
				});
			}
			var g = "CheckboxTrigger",
				w = a.forwardRef(({ __scopeCheckbox: e, onKeyDown: r, onClick: t, ...i }, l) => {
					let {
							control: o,
							value: u,
							disabled: s,
							checked: p,
							required: y,
							setControl: f,
							setChecked: k,
							hasConsumerStoppedPropagationRef: m,
							isFormControl: w,
							bubbleInput: x,
						} = v(g, e),
						b = (0, n.s)(l, f),
						M = a.useRef(p);
					return (
						a.useEffect(() => {
							let e = o?.form;
							if (e) {
								let r = () => k(M.current);
								return (
									e.addEventListener("reset", r),
									() => e.removeEventListener("reset", r)
								);
							}
						}, [o, k]),
						(0, h.jsx)(d.sG.button, {
							type: "button",
							role: "checkbox",
							"aria-checked": E(p) ? "mixed" : p,
							"aria-required": y,
							"data-state": j(p),
							"data-disabled": s ? "" : void 0,
							disabled: s,
							value: u,
							...i,
							ref: b,
							onKeyDown: (0, c.mK)(r, (e) => {
								"Enter" === e.key && e.preventDefault();
							}),
							onClick: (0, c.mK)(t, (e) => {
								k((e) => !!E(e) || !e),
									x &&
										w &&
										((m.current = e.isPropagationStopped()),
										m.current || e.stopPropagation());
							}),
						})
					);
				});
			w.displayName = g;
			var x = a.forwardRef((e, r) => {
				let {
					__scopeCheckbox: t,
					name: a,
					checked: n,
					defaultChecked: i,
					required: c,
					disabled: l,
					value: o,
					onCheckedChange: u,
					form: s,
					...d
				} = e;
				return (0, h.jsx)(m, {
					__scopeCheckbox: t,
					checked: n,
					defaultChecked: i,
					disabled: l,
					required: c,
					onCheckedChange: u,
					name: a,
					form: s,
					value: o,
					internal_do_not_use_render: ({ isFormControl: e }) =>
						(0, h.jsxs)(h.Fragment, {
							children: [
								(0, h.jsx)(w, { ...d, ref: r, __scopeCheckbox: t }),
								e && (0, h.jsx)(C, { __scopeCheckbox: t }),
							],
						}),
				});
			});
			x.displayName = p;
			var b = "CheckboxIndicator",
				M = a.forwardRef((e, r) => {
					let { __scopeCheckbox: t, forceMount: a, ...n } = e,
						i = v(b, t);
					return (0, h.jsx)(s.C, {
						present: a || E(i.checked) || !0 === i.checked,
						children: (0, h.jsx)(d.sG.span, {
							"data-state": j(i.checked),
							"data-disabled": i.disabled ? "" : void 0,
							...n,
							ref: r,
							style: { pointerEvents: "none", ...e.style },
						}),
					});
				});
			M.displayName = b;
			var A = "CheckboxBubbleInput",
				C = a.forwardRef(({ __scopeCheckbox: e, ...r }, t) => {
					let {
							control: i,
							hasConsumerStoppedPropagationRef: c,
							checked: l,
							defaultChecked: s,
							required: p,
							disabled: y,
							name: f,
							value: k,
							form: m,
							bubbleInput: g,
							setBubbleInput: w,
						} = v(A, e),
						x = (0, n.s)(t, w),
						b = (0, o.Z)(l),
						M = (0, u.X)(i);
					a.useEffect(() => {
						if (!g) return;
						let e = Object.getOwnPropertyDescriptor(
								window.HTMLInputElement.prototype,
								"checked"
							).set,
							r = !c.current;
						if (b !== l && e) {
							let t = new Event("click", { bubbles: r });
							(g.indeterminate = E(l)), e.call(g, !E(l) && l), g.dispatchEvent(t);
						}
					}, [g, b, l, c]);
					let C = a.useRef(!E(l) && l);
					return (0, h.jsx)(d.sG.input, {
						type: "checkbox",
						"aria-hidden": !0,
						defaultChecked: s ?? C.current,
						required: p,
						disabled: y,
						name: f,
						value: k,
						form: m,
						...r,
						tabIndex: -1,
						ref: x,
						style: {
							...r.style,
							...M,
							position: "absolute",
							pointerEvents: "none",
							opacity: 0,
							margin: 0,
							transform: "translateX(-100%)",
						},
					});
				});
			function E(e) {
				return "indeterminate" === e;
			}
			function j(e) {
				return E(e) ? "indeterminate" : e ? "checked" : "unchecked";
			}
			C.displayName = A;
		},
		48368: (e, r, t) => {
			t.d(r, { A: () => a });
			let a = (0, t(90425).A)("file-text", [
				[
					"path",
					{
						d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
						key: "1oefj6",
					},
				],
				["path", { d: "M14 2v5a1 1 0 0 0 1 1h5", key: "wfsgrz" }],
				["path", { d: "M10 9H8", key: "b1mrlr" }],
				["path", { d: "M16 13H8", key: "t4e002" }],
				["path", { d: "M16 17H8", key: "z1uh3a" }],
			]);
		},
		60504: (e, r, t) => {
			t.d(r, { A: () => o });
			var a = t(12115),
				n = t(90901),
				i = t(44855),
				c = t(12180);
			let l = c.r
					? (e) => {
							e();
					  }
					: a.startTransition,
				o = (0, n.Ht)(i.Ay, () => (e, r, t = {}) => {
					let { mutate: i } = (0, n.iX)(),
						o = (0, a.useRef)(e),
						u = (0, a.useRef)(r),
						s = (0, a.useRef)(t),
						d = (0, a.useRef)(0),
						[h, p, y] = ((e) => {
							let [, r] = (0, a.useState)({}),
								t = (0, a.useRef)(!1),
								n = (0, a.useRef)(e),
								i = (0, a.useRef)({ data: !1, error: !1, isValidating: !1 }),
								l = (0, a.useCallback)((e) => {
									let a = !1,
										c = n.current;
									for (let r in e)
										Object.prototype.hasOwnProperty.call(e, r) &&
											c[r] !== e[r] &&
											((c[r] = e[r]), i.current[r] && (a = !0));
									a && !t.current && r({});
								}, []);
							return (
								(0, c.u)(
									() => (
										(t.current = !1),
										() => {
											t.current = !0;
										}
									)
								),
								[n, i.current, l]
							);
						})({ data: c.U, error: c.U, isMutating: !1 }),
						f = h.current,
						k = (0, a.useCallback)(async (e, r) => {
							let [t, a] = (0, c.s)(o.current);
							if (!u.current)
								throw Error("Can’t trigger the mutation: missing fetcher.");
							if (!t) throw Error("Can’t trigger the mutation: missing key.");
							let n = (0, c.m)(
									(0, c.m)({ populateCache: !1, throwOnError: !0 }, s.current),
									r
								),
								h = (0, c.o)();
							(d.current = h), y({ isMutating: !0 });
							try {
								let r = await i(
									t,
									u.current(a, { arg: e }),
									(0, c.m)(n, { throwOnError: !0 })
								);
								return (
									d.current <= h &&
										(l(() => y({ data: r, isMutating: !1, error: void 0 })),
										null == n.onSuccess || n.onSuccess.call(n, r, t, n)),
									r
								);
							} catch (e) {
								if (
									d.current <= h &&
									(l(() => y({ error: e, isMutating: !1 })),
									null == n.onError || n.onError.call(n, e, t, n),
									n.throwOnError)
								)
									throw e;
							}
						}, []),
						v = (0, a.useCallback)(() => {
							(d.current = (0, c.o)()), y({ data: c.U, error: c.U, isMutating: !1 });
						}, []);
					return (
						(0, c.u)(() => {
							(o.current = e), (u.current = r), (s.current = t);
						}),
						{
							trigger: k,
							reset: v,
							get data() {
								return (p.data = !0), f.data;
							},
							get error() {
								return (p.error = !0), f.error;
							},
							get isMutating() {
								return (p.isMutating = !0), f.isMutating;
							},
						}
					);
				});
		},
		68459: (e, r, t) => {
			t.d(r, { A: () => a });
			let a = (0, t(90425).A)("trash-2", [
				["path", { d: "M10 11v6", key: "nco0om" }],
				["path", { d: "M14 11v6", key: "outv1u" }],
				["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", key: "miytrc" }],
				["path", { d: "M3 6h18", key: "d0wm0j" }],
				["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", key: "e791ji" }],
			]);
		},
		80723: (e, r, t) => {
			t.d(r, { A: () => a });
			let a = (0, t(90425).A)("arrow-left", [
				["path", { d: "m12 19-7-7 7-7", key: "1l729n" }],
				["path", { d: "M19 12H5", key: "x3x0zl" }],
			]);
		},
		89803: (e, r, t) => {
			t.d(r, { b: () => s });
			var a = t(12115);
			t(47650);
			var n = t(42442),
				i = t(95155),
				c = [
					"a",
					"button",
					"div",
					"form",
					"h2",
					"h3",
					"img",
					"input",
					"label",
					"li",
					"nav",
					"ol",
					"p",
					"select",
					"span",
					"svg",
					"ul",
				].reduce((e, r) => {
					let t = (0, n.TL)(`Primitive.${r}`),
						c = a.forwardRef((e, a) => {
							let { asChild: n, ...c } = e;
							return (
								"u" > typeof window && (window[Symbol.for("radix-ui")] = !0),
								(0, i.jsx)(n ? t : r, { ...c, ref: a })
							);
						});
					return (c.displayName = `Primitive.${r}`), { ...e, [r]: c };
				}, {}),
				l = "horizontal",
				o = ["horizontal", "vertical"],
				u = a.forwardRef((e, r) => {
					var t;
					let { decorative: a, orientation: n = l, ...u } = e,
						s = ((t = n), o.includes(t)) ? n : l;
					return (0, i.jsx)(c.div, {
						"data-orientation": s,
						...(a
							? { role: "none" }
							: {
									"aria-orientation": "vertical" === s ? s : void 0,
									role: "separator",
							  }),
						...u,
						ref: r,
					});
				});
			u.displayName = "Separator";
			var s = u;
		},
		94290: (e, r, t) => {
			t.d(r, { A: () => a });
			let a = (0, t(90425).A)("star", [
				[
					"path",
					{
						d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
						key: "r04s7s",
					},
				],
			]);
		},
	},
]);
