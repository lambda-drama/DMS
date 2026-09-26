(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[5345, 7898],
	{
		8247: (e, t, a) => {
			"use strict";
			a.r(t), a.d(t, { default: () => n });
			var r = a(95155),
				s = a(45328);
			function n() {
				return (0, r.jsx)(s.g, {});
			}
		},
		25311: (e, t, a) => {
			"use strict";
			a.d(t, { A: () => r });
			let r = (0, a(90425).A)("user-cog", [
				["path", { d: "M10 15H6a4 4 0 0 0-4 4v2", key: "1nfge6" }],
				["path", { d: "m14.305 16.53.923-.382", key: "1itpsq" }],
				["path", { d: "m15.228 13.852-.923-.383", key: "eplpkm" }],
				["path", { d: "m16.852 12.228-.383-.923", key: "13v3q0" }],
				["path", { d: "m16.852 17.772-.383.924", key: "1i8mnm" }],
				["path", { d: "m19.148 12.228.383-.923", key: "1q8j1v" }],
				["path", { d: "m19.53 18.696-.382-.924", key: "vk1qj3" }],
				["path", { d: "m20.772 13.852.924-.383", key: "n880s0" }],
				["path", { d: "m20.772 16.148.924.383", key: "1g6xey" }],
				["circle", { cx: "18", cy: "15", r: "3", key: "gjjjvw" }],
				["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
			]);
		},
		33210: (e, t, a) => {
			"use strict";
			a.d(t, { A: () => r });
			let r = (0, a(90425).A)("x", [
				["path", { d: "M18 6 6 18", key: "1bl5f8" }],
				["path", { d: "m6 6 12 12", key: "d8bk6v" }],
			]);
		},
		33420: (e, t, a) => {
			Promise.resolve().then(a.bind(a, 8247));
		},
		35756: (e, t, a) => {
			"use strict";
			a.d(t, { A: () => r });
			let r = (0, a(90425).A)("key-round", [
				[
					"path",
					{
						d: "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z",
						key: "1s6t7t",
					},
				],
				[
					"circle",
					{ cx: "16.5", cy: "7.5", r: ".5", fill: "currentColor", key: "w0ekpg" },
				],
			]);
		},
		41015: (e, t, a) => {
			"use strict";
			a.d(t, {
				JK: () => n,
				TK: () => d,
				ec: () => l,
				im: () => c,
				kg: () => o,
				ly: () => i,
			});
			var r = a(49876);
			let s = "dms.api.users";
			async function n() {
				return (0, r.AT)(`/api/method/${s}.get_users_bootstrap`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
			async function o(e) {
				return (0, r.AT)(`/api/method/${s}.create_user`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function d(e) {
				return (0, r.AT)(`/api/method/${s}.update_user`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function i(e) {
				return (0, r.AT)(`/api/method/${s}.set_user_password`, {
					method: "POST",
					body: JSON.stringify(e),
				});
			}
			async function l(e) {
				return (0, r.AT)(`/api/method/${s}.change_password`, {
					method: "POST",
					body: JSON.stringify(e),
				});
			}
			async function c() {
				return (0, r.AT)(`/api/method/${s}.get_password_status`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
		},
		47279: (e, t, a) => {
			"use strict";
			a.d(t, { C1: () => w, bL: () => b });
			var r = a(12115),
				s = a(47527),
				n = a(68599),
				o = a(70379),
				d = a(98979),
				i = a(83417),
				l = a(63509),
				c = a(83935),
				u = a(99354),
				p = a(95155),
				f = "Checkbox",
				[h, m] = (0, n.A)(f),
				[y, g] = h(f);
			function k(e) {
				let {
						__scopeCheckbox: t,
						checked: a,
						children: s,
						defaultChecked: n,
						disabled: o,
						form: i,
						name: l,
						onCheckedChange: c,
						required: u,
						value: h = "on",
						internal_do_not_use_render: m,
					} = e,
					[g, k] = (0, d.i)({ prop: a, defaultProp: n ?? !1, onChange: c, caller: f }),
					[x, v] = r.useState(null),
					[b, j] = r.useState(null),
					w = r.useRef(!1),
					A = !x || !!i || !!x.closest("form"),
					N = {
						checked: g,
						disabled: o,
						setChecked: k,
						control: x,
						setControl: v,
						name: l,
						form: i,
						value: h,
						hasConsumerStoppedPropagationRef: w,
						required: u,
						defaultChecked: !_(n) && n,
						isFormControl: A,
						bubbleInput: b,
						setBubbleInput: j,
					};
				return (0, p.jsx)(y, {
					scope: t,
					...N,
					children: "function" == typeof m ? m(N) : s,
				});
			}
			var x = "CheckboxTrigger",
				v = r.forwardRef(({ __scopeCheckbox: e, onKeyDown: t, onClick: a, ...n }, d) => {
					let {
							control: i,
							value: l,
							disabled: c,
							checked: f,
							required: h,
							setControl: m,
							setChecked: y,
							hasConsumerStoppedPropagationRef: k,
							isFormControl: v,
							bubbleInput: b,
						} = g(x, e),
						j = (0, s.s)(d, m),
						w = r.useRef(f);
					return (
						r.useEffect(() => {
							let e = i?.form;
							if (e) {
								let t = () => y(w.current);
								return (
									e.addEventListener("reset", t),
									() => e.removeEventListener("reset", t)
								);
							}
						}, [i, y]),
						(0, p.jsx)(u.sG.button, {
							type: "button",
							role: "checkbox",
							"aria-checked": _(f) ? "mixed" : f,
							"aria-required": h,
							"data-state": O(f),
							"data-disabled": c ? "" : void 0,
							disabled: c,
							value: l,
							...n,
							ref: j,
							onKeyDown: (0, o.mK)(t, (e) => {
								"Enter" === e.key && e.preventDefault();
							}),
							onClick: (0, o.mK)(a, (e) => {
								y((e) => !!_(e) || !e),
									b &&
										v &&
										((k.current = e.isPropagationStopped()),
										k.current || e.stopPropagation());
							}),
						})
					);
				});
			v.displayName = x;
			var b = r.forwardRef((e, t) => {
				let {
					__scopeCheckbox: a,
					name: r,
					checked: s,
					defaultChecked: n,
					required: o,
					disabled: d,
					value: i,
					onCheckedChange: l,
					form: c,
					...u
				} = e;
				return (0, p.jsx)(k, {
					__scopeCheckbox: a,
					checked: s,
					defaultChecked: n,
					disabled: d,
					required: o,
					onCheckedChange: l,
					name: r,
					form: c,
					value: i,
					internal_do_not_use_render: ({ isFormControl: e }) =>
						(0, p.jsxs)(p.Fragment, {
							children: [
								(0, p.jsx)(v, { ...u, ref: t, __scopeCheckbox: a }),
								e && (0, p.jsx)(N, { __scopeCheckbox: a }),
							],
						}),
				});
			});
			b.displayName = f;
			var j = "CheckboxIndicator",
				w = r.forwardRef((e, t) => {
					let { __scopeCheckbox: a, forceMount: r, ...s } = e,
						n = g(j, a);
					return (0, p.jsx)(c.C, {
						present: r || _(n.checked) || !0 === n.checked,
						children: (0, p.jsx)(u.sG.span, {
							"data-state": O(n.checked),
							"data-disabled": n.disabled ? "" : void 0,
							...s,
							ref: t,
							style: { pointerEvents: "none", ...e.style },
						}),
					});
				});
			w.displayName = j;
			var A = "CheckboxBubbleInput",
				N = r.forwardRef(({ __scopeCheckbox: e, ...t }, a) => {
					let {
							control: n,
							hasConsumerStoppedPropagationRef: o,
							checked: d,
							defaultChecked: c,
							required: f,
							disabled: h,
							name: m,
							value: y,
							form: k,
							bubbleInput: x,
							setBubbleInput: v,
						} = g(A, e),
						b = (0, s.s)(a, v),
						j = (0, i.Z)(d),
						w = (0, l.X)(n);
					r.useEffect(() => {
						if (!x) return;
						let e = Object.getOwnPropertyDescriptor(
								window.HTMLInputElement.prototype,
								"checked"
							).set,
							t = !o.current;
						if (j !== d && e) {
							let a = new Event("click", { bubbles: t });
							(x.indeterminate = _(d)), e.call(x, !_(d) && d), x.dispatchEvent(a);
						}
					}, [x, j, d, o]);
					let N = r.useRef(!_(d) && d);
					return (0, p.jsx)(u.sG.input, {
						type: "checkbox",
						"aria-hidden": !0,
						defaultChecked: c ?? N.current,
						required: f,
						disabled: h,
						name: m,
						value: y,
						form: k,
						...t,
						tabIndex: -1,
						ref: b,
						style: {
							...t.style,
							...w,
							position: "absolute",
							pointerEvents: "none",
							opacity: 0,
							margin: 0,
							transform: "translateX(-100%)",
						},
					});
				});
			function _(e) {
				return "indeterminate" === e;
			}
			function O(e) {
				return _(e) ? "indeterminate" : e ? "checked" : "unchecked";
			}
			N.displayName = A;
		},
		49387: (e, t, a) => {
			"use strict";
			a.d(t, { A: () => r });
			let r = (0, a(90425).A)("pencil", [
				[
					"path",
					{
						d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
						key: "1a8usu",
					},
				],
				["path", { d: "m15 5 4 4", key: "1mk7zo" }],
			]);
		},
		51914: (e, t, a) => {
			"use strict";
			a.d(t, { A: () => r });
			let r = (0, a(90425).A)("plus", [
				["path", { d: "M5 12h14", key: "1ays0h" }],
				["path", { d: "M12 5v14", key: "s699le" }],
			]);
		},
		56563: (e, t, a) => {
			"use strict";
			a.d(t, { A: () => r });
			let r = (0, a(90425).A)("chevrons-up-down", [
				["path", { d: "m7 15 5 5 5-5", key: "1hf1tw" }],
				["path", { d: "m7 9 5-5 5 5", key: "sgt6xg" }],
			]);
		},
		61878: (e, t, a) => {
			"use strict";
			a.d(t, { A: () => r });
			let r = (0, a(90425).A)("search", [
				["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
				["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
			]);
		},
		74350: (e, t, a) => {
			"use strict";
			a.d(t, {
				Cf: () => u,
				Es: () => f,
				L3: () => h,
				c7: () => p,
				lG: () => i,
				rr: () => m,
			});
			var r = a(95155);
			a(12115);
			var s = a(29483),
				n = a(33210),
				o = a(91337),
				d = a(10086);
			function i({ ...e }) {
				return (0, r.jsx)(s.bL, { "data-slot": "dialog", ...e });
			}
			function l({ ...e }) {
				return (0, r.jsx)(s.ZL, { "data-slot": "dialog-portal", ...e });
			}
			function c({ className: e, ...t }) {
				return (0, r.jsx)(s.hJ, {
					"data-slot": "dialog-overlay",
					className: (0, o.cn)(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
						e
					),
					...t,
				});
			}
			function u({
				className: e,
				children: t,
				showCloseButton: a = !0,
				headerActions: i,
				onPointerDownOutside: p,
				onInteractOutside: f,
				onFocusOutside: h,
				...m
			}) {
				return (0, r.jsxs)(l, {
					"data-slot": "dialog-portal",
					children: [
						(0, r.jsx)(c, {}),
						(0, r.jsxs)(s.UC, {
							"data-slot": "dialog-content",
							className: (0, o.cn)(
								"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
								e
							),
							onPointerDownOutside: (e) => {
								(0, d.JM)(e.target) ? e.preventDefault() : p?.(e);
							},
							onInteractOutside: (e) => {
								(0, d.JM)(e.target) ? e.preventDefault() : f?.(e);
							},
							onFocusOutside: (e) => {
								(0, d.JM)(e.target) ? e.preventDefault() : h?.(e);
							},
							...m,
							children: [
								t,
								(i || a) &&
									(0, r.jsxs)("div", {
										className:
											"absolute top-4 right-4 flex items-center gap-1",
										children: [
											i,
											a &&
												(0, r.jsxs)(s.bm, {
													"data-slot": "dialog-close",
													className:
														"ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
													children: [
														(0, r.jsx)(n.A, {}),
														(0, r.jsx)("span", {
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
			function p({ className: e, ...t }) {
				return (0, r.jsx)("div", {
					"data-slot": "dialog-header",
					className: (0, o.cn)("flex flex-col gap-2 text-center sm:text-left", e),
					...t,
				});
			}
			function f({ className: e, ...t }) {
				return (0, r.jsx)("div", {
					"data-slot": "dialog-footer",
					className: (0, o.cn)(
						"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
						e
					),
					...t,
				});
			}
			function h({ className: e, ...t }) {
				return (0, r.jsx)(s.hE, {
					"data-slot": "dialog-title",
					className: (0, o.cn)("text-lg leading-none font-semibold", e),
					...t,
				});
			}
			function m({ className: e, ...t }) {
				return (0, r.jsx)(s.VY, {
					"data-slot": "dialog-description",
					className: (0, o.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
		},
		79792: (e, t, a) => {
			"use strict";
			a.d(t, { J: () => o });
			var r = a(95155);
			a(12115);
			var s = a(91760),
				n = a(91337);
			function o({ className: e, ...t }) {
				return (0, r.jsx)(s.b, {
					"data-slot": "label",
					className: (0, n.cn)(
						"flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
						e
					),
					...t,
				});
			}
		},
		91760: (e, t, a) => {
			"use strict";
			a.d(t, { b: () => i });
			var r = a(12115);
			a(47650);
			var s = a(42442),
				n = a(95155),
				o = [
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
				].reduce((e, t) => {
					let a = (0, s.TL)(`Primitive.${t}`),
						o = r.forwardRef((e, r) => {
							let { asChild: s, ...o } = e;
							return (
								"u" > typeof window && (window[Symbol.for("radix-ui")] = !0),
								(0, n.jsx)(s ? a : t, { ...o, ref: r })
							);
						});
					return (o.displayName = `Primitive.${t}`), { ...e, [t]: o };
				}, {}),
				d = r.forwardRef((e, t) =>
					(0, n.jsx)(o.label, {
						...e,
						ref: t,
						onMouseDown: (t) => {
							t.target.closest("button, input, select, textarea") ||
								(e.onMouseDown?.(t),
								!t.defaultPrevented && t.detail > 1 && t.preventDefault());
						},
					})
				);
			d.displayName = "Label";
			var i = d;
		},
		91958: (e, t, a) => {
			"use strict";
			a.d(t, { A: () => r });
			let r = (0, a(90425).A)("refresh-cw", [
				[
					"path",
					{ d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", key: "v9h5vc" },
				],
				["path", { d: "M21 3v5h-5", key: "1q7to0" }],
				[
					"path",
					{ d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", key: "3uifl3" },
				],
				["path", { d: "M8 16H3v5", key: "1cv678" }],
			]);
		},
		94514: (e, t, a) => {
			"use strict";
			a.d(t, { A: () => r });
			let r = (0, a(90425).A)("check", [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]]);
		},
	},
	(e) => {
		e.O(
			0,
			[5139, 878, 8409, 4855, 454, 6609, 410, 7605, 1602, 2372, 5328, 8441, 3794, 7358],
			() => e((e.s = 33420))
		),
			(_N_E = e.O());
	},
]);
