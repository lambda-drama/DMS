"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[6212],
	{
		9141: (e, t, a) => {
			a.d(t, { H: () => b });
			var r = a(95155),
				n = a(12115),
				s = a(6296),
				i = a(66609),
				l = a(90901),
				o = a(74350),
				d = a(4474),
				c = a(39658),
				u = a(79792),
				f = a(26518),
				g = a(65588),
				m = a(28196);
			let p = [
					"Trainee",
					"Junior",
					"Intermediate",
					"Senior",
					"Master Technician",
					"EV/PHEV Certified",
					"Expert",
				],
				v = ["Standard", "Senior", "Specialist", "Warranty", "Internal", "Training"],
				x = ["Active", "On Leave", "Inactive", "Terminated"];
			function h() {
				return new Date().toISOString().slice(0, 10);
			}
			function b({ open: e, onOpenChange: t, onCreated: a, technician: j, onUpdated: y }) {
				let { mutate: N } = (0, l.iX)(),
					w = !!j?.name,
					[_, k] = (0, n.useState)(!1),
					[S, C] = (0, n.useState)(""),
					[z, T] = (0, n.useState)(""),
					[$, A] = (0, n.useState)(""),
					[J, D] = (0, n.useState)(h),
					[E, q] = (0, n.useState)("Junior"),
					[F, L] = (0, n.useState)("Standard"),
					[M, V] = (0, n.useState)("Active");
				async function O() {
					await N(
						(e) => {
							if ("string" == typeof e && "technicians" === e) return !0;
							if (Array.isArray(e) && "string" == typeof e[0]) {
								let t = e[0];
								return (
									"technicians" === t ||
									"technicians-list" === t ||
									"technicians-availability" === t ||
									"technician" === t ||
									"technician-detail" === t
								);
							}
							return !1;
						},
						void 0,
						{ revalidate: !0 }
					);
				}
				async function U(e) {
					if ((e.preventDefault(), !S.trim() || !$.trim()))
						return void i.o.error("First name and personal phone are required");
					k(!0);
					try {
						if (w && j?.name) {
							await m.aL(j.name, {
								first_name: S.trim(),
								last_name: z.trim(),
								personal_phone: $.trim(),
								date_of_joining: J || h(),
								skill_level: E,
								labor_rate_group: F,
								status: M,
							}),
								await O(),
								i.o.success("Technician updated"),
								y?.(j.name),
								t(!1);
							return;
						}
						let e = await (0, g._)("Technician", {
							first_name: S.trim(),
							last_name: z.trim(),
							personal_phone: $.trim(),
							date_of_joining: J || h(),
							skill_level: E,
							labor_rate_group: F,
						});
						await O(),
							i.o.success(`Technician ${e.label || e.name} created`),
							a?.(e.name, e.label),
							t(!1);
					} catch (e) {
						i.o.error(
							e instanceof Error
								? e.message
								: w
								? "Failed to update technician"
								: "Failed to create technician"
						);
					} finally {
						k(!1);
					}
				}
				return (
					(0, n.useEffect)(() => {
						if (e) {
							if (j?.name) {
								C(j.first_name || ""),
									T(j.last_name || ""),
									A(j.personal_phone || ""),
									D(
										j.date_of_joining
											? String(j.date_of_joining).slice(0, 10)
											: h()
									),
									q(j.skill_level || "Junior"),
									L(j.labor_rate_group || "Standard"),
									V(j.status || "Active");
								return;
							}
							C(""), T(""), A(""), D(h()), q("Junior"), L("Standard"), V("Active");
						}
					}, [e, j]),
					(0, r.jsx)(o.lG, {
						open: e,
						onOpenChange: t,
						children: (0, r.jsx)(o.Cf, {
							className: "sm:max-w-md",
							children: (0, r.jsxs)("form", {
								onSubmit: U,
								children: [
									(0, r.jsxs)(o.c7, {
										children: [
											(0, r.jsx)(o.L3, {
												children: w ? "Edit technician" : "New technician",
											}),
											(0, r.jsx)(o.rr, {
												children: w
													? "Update technician details used on job cards and scheduling."
													: "Add a technician for job cards, scheduling, and workshop assignments.",
											}),
										],
									}),
									(0, r.jsxs)("div", {
										className: "grid gap-3 py-4",
										children: [
											(0, r.jsxs)("div", {
												className: "grid grid-cols-2 gap-2",
												children: [
													(0, r.jsxs)("div", {
														className: "space-y-1",
														children: [
															(0, r.jsx)(u.J, {
																children: "First name *",
															}),
															(0, r.jsx)(c.p, {
																value: S,
																onChange: (e) => C(e.target.value),
																autoFocus: !0,
															}),
														],
													}),
													(0, r.jsxs)("div", {
														className: "space-y-1",
														children: [
															(0, r.jsx)(u.J, {
																children: "Last name",
															}),
															(0, r.jsx)(c.p, {
																value: z,
																onChange: (e) => T(e.target.value),
															}),
														],
													}),
												],
											}),
											(0, r.jsxs)("div", {
												className: "space-y-1",
												children: [
													(0, r.jsx)(u.J, {
														children: "Personal phone *",
													}),
													(0, r.jsx)(c.p, {
														type: "tel",
														value: $,
														onChange: (e) => A(e.target.value),
													}),
												],
											}),
											(0, r.jsxs)("div", {
												className: "space-y-1",
												children: [
													(0, r.jsx)(u.J, {
														children: "Date of joining",
													}),
													(0, r.jsx)(c.p, {
														type: "date",
														value: J,
														onChange: (e) => D(e.target.value),
													}),
												],
											}),
											(0, r.jsxs)("div", {
												className: "grid grid-cols-2 gap-2",
												children: [
													(0, r.jsxs)("div", {
														className: "space-y-1",
														children: [
															(0, r.jsx)(u.J, {
																children: "Skill level",
															}),
															(0, r.jsxs)(f.l6, {
																value: E,
																onValueChange: q,
																children: [
																	(0, r.jsx)(f.bq, {
																		children: (0, r.jsx)(
																			f.yv,
																			{}
																		),
																	}),
																	(0, r.jsx)(f.gC, {
																		children: p.map((e) =>
																			(0, r.jsx)(
																				f.eb,
																				{
																					value: e,
																					children: e,
																				},
																				e
																			)
																		),
																	}),
																],
															}),
														],
													}),
													(0, r.jsxs)("div", {
														className: "space-y-1",
														children: [
															(0, r.jsx)(u.J, {
																children: "Labor rate group",
															}),
															(0, r.jsxs)(f.l6, {
																value: F,
																onValueChange: L,
																children: [
																	(0, r.jsx)(f.bq, {
																		children: (0, r.jsx)(
																			f.yv,
																			{}
																		),
																	}),
																	(0, r.jsx)(f.gC, {
																		children: v.map((e) =>
																			(0, r.jsx)(
																				f.eb,
																				{
																					value: e,
																					children: e,
																				},
																				e
																			)
																		),
																	}),
																],
															}),
														],
													}),
												],
											}),
											w
												? (0, r.jsxs)("div", {
														className: "space-y-1",
														children: [
															(0, r.jsx)(u.J, {
																children: "Status",
															}),
															(0, r.jsxs)(f.l6, {
																value: M,
																onValueChange: V,
																children: [
																	(0, r.jsx)(f.bq, {
																		children: (0, r.jsx)(
																			f.yv,
																			{}
																		),
																	}),
																	(0, r.jsx)(f.gC, {
																		children: x.map((e) =>
																			(0, r.jsx)(
																				f.eb,
																				{
																					value: e,
																					children: e,
																				},
																				e
																			)
																		),
																	}),
																],
															}),
														],
												  })
												: null,
										],
									}),
									(0, r.jsxs)(o.Es, {
										children: [
											(0, r.jsx)(d.$, {
												type: "button",
												variant: "outline",
												onClick: () => t(!1),
												children: "Cancel",
											}),
											(0, r.jsxs)(d.$, {
												type: "submit",
												disabled: _,
												children: [
													_
														? (0, r.jsx)(s.A, {
																className:
																	"mr-2 h-4 w-4 animate-spin",
														  })
														: null,
													w ? "Save" : "Create",
												],
											}),
										],
									}),
								],
							}),
						}),
					})
				);
			}
		},
		15306: (e, t, a) => {
			a.d(t, { Xi: () => o, av: () => d, j7: () => l, tU: () => i });
			var r = a(95155);
			a(12115);
			var n = a(57518),
				s = a(91337);
			function i({ className: e, ...t }) {
				return (0, r.jsx)(n.bL, {
					"data-slot": "tabs",
					className: (0, s.cn)("flex flex-col gap-2", e),
					...t,
				});
			}
			function l({ className: e, ...t }) {
				return (0, r.jsx)(n.B8, {
					"data-slot": "tabs-list",
					className: (0, s.cn)(
						"bg-muted text-muted-foreground inline-flex h-9 w-fit max-w-full items-center justify-start overflow-x-auto rounded-lg p-[3px]",
						e
					),
					...t,
				});
			}
			function o({ className: e, ...t }) {
				return (0, r.jsx)(n.l9, {
					"data-slot": "tabs-trigger",
					className: (0, s.cn)(
						"data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
						e
					),
					...t,
				});
			}
			function d({ className: e, ...t }) {
				return (0, r.jsx)(n.UC, {
					"data-slot": "tabs-content",
					className: (0, s.cn)("outline-none data-[state=inactive]:hidden", e),
					...t,
				});
			}
		},
		26518: (e, t, a) => {
			a.d(t, { bq: () => u, eb: () => g, gC: () => f, l6: () => d, yv: () => c });
			var r = a(95155);
			a(12115);
			var n = a(40287),
				s = a(66088),
				i = a(94514),
				l = a(9921),
				o = a(91337);
			function d({ ...e }) {
				return (0, r.jsx)(n.bL, { "data-slot": "select", ...e });
			}
			function c({ ...e }) {
				return (0, r.jsx)(n.WT, { "data-slot": "select-value", ...e });
			}
			function u({ className: e, size: t = "default", children: a, ...i }) {
				return (0, r.jsxs)(n.l9, {
					"data-slot": "select-trigger",
					"data-size": t,
					className: (0, o.cn)(
						"border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex h-9 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-full border bg-transparent px-4 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
						e
					),
					...i,
					children: [
						a,
						(0, r.jsx)(n.In, {
							asChild: !0,
							children: (0, r.jsx)(s.A, { className: "size-4 opacity-50" }),
						}),
					],
				});
			}
			function f({ className: e, children: t, position: a = "popper", ...s }) {
				return (0, r.jsx)(n.ZL, {
					children: (0, r.jsxs)(n.UC, {
						"data-slot": "select-content",
						className: (0, o.cn)(
							"bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
							"popper" === a &&
								"data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
							e
						),
						position: a,
						...s,
						children: [
							(0, r.jsx)(m, {}),
							(0, r.jsx)(n.LM, {
								className: (0, o.cn)(
									"p-1",
									"popper" === a &&
										"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
								),
								children: t,
							}),
							(0, r.jsx)(p, {}),
						],
					}),
				});
			}
			function g({ className: e, children: t, ...a }) {
				return (0, r.jsxs)(n.q7, {
					"data-slot": "select-item",
					className: (0, o.cn)(
						"focus:bg-dms-green-light focus:text-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
						e
					),
					...a,
					children: [
						(0, r.jsx)("span", {
							className:
								"absolute right-2 flex size-3.5 items-center justify-center",
							children: (0, r.jsx)(n.VF, {
								children: (0, r.jsx)(i.A, { className: "size-4" }),
							}),
						}),
						(0, r.jsx)(n.p4, { children: t }),
					],
				});
			}
			function m({ className: e, ...t }) {
				return (0, r.jsx)(n.PP, {
					"data-slot": "select-scroll-up-button",
					className: (0, o.cn)(
						"flex cursor-default items-center justify-center py-1",
						e
					),
					...t,
					children: (0, r.jsx)(l.A, { className: "size-4" }),
				});
			}
			function p({ className: e, ...t }) {
				return (0, r.jsx)(n.wn, {
					"data-slot": "select-scroll-down-button",
					className: (0, o.cn)(
						"flex cursor-default items-center justify-center py-1",
						e
					),
					...t,
					children: (0, r.jsx)(s.A, { className: "size-4" }),
				});
			}
		},
		38291: (e, t, a) => {
			a.d(t, { E: () => o });
			var r = a(95155);
			a(12115);
			var n = a(42442),
				s = a(18460),
				i = a(91337);
			let l = (0, s.F)(
				"inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
				{
					variants: {
						variant: {
							default:
								"border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
							secondary:
								"border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
							destructive:
								"border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
							outline:
								"text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
						},
					},
					defaultVariants: { variant: "default" },
				}
			);
			function o({ className: e, variant: t, asChild: a = !1, ...s }) {
				let d = a ? n.DX : "span";
				return (0, r.jsx)(d, {
					"data-slot": "badge",
					className: (0, i.cn)(l({ variant: t }), e),
					...s,
				});
			}
		},
		65588: (e, t, a) => {
			a.d(t, { _: () => n });
			var r = a(49876);
			async function n(e, t) {
				var a = await (0, r.AT)("/api/method/dms.api.quick_create.quick_create_doc", {
					method: "POST",
					body: JSON.stringify({ doctype: e, values: t }),
				});
				if (!a || "object" != typeof a) throw Error("Unexpected response from server");
				let n = a.name;
				if ("string" != typeof n || !n.trim())
					throw Error("Unexpected response from server");
				let s = a.label;
				return {
					name: n.trim(),
					label: "string" == typeof s && s.trim() ? s.trim() : void 0,
				};
			}
		},
		79984: (e, t, a) => {
			a.d(t, { BT: () => o, Wu: () => d, ZB: () => l, Zp: () => s, aR: () => i });
			var r = a(95155);
			a(12115);
			var n = a(91337);
			function s({ className: e, ...t }) {
				return (0, r.jsx)("div", {
					"data-slot": "card",
					className: (0, n.cn)(
						"bg-card text-card-foreground flex flex-col gap-2 rounded-[1.15rem] border py-3 shadow-[0_4px_20px_rgba(15,61,94,0.05)]",
						e
					),
					...t,
				});
			}
			function i({ className: e, ...t }) {
				return (0, r.jsx)("div", {
					"data-slot": "card-header",
					className: (0, n.cn)(
						"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-3",
						e
					),
					...t,
				});
			}
			function l({ className: e, ...t }) {
				return (0, r.jsx)("div", {
					"data-slot": "card-title",
					className: (0, n.cn)(
						"leading-none font-serif-display font-semibold tracking-tight",
						e
					),
					...t,
				});
			}
			function o({ className: e, ...t }) {
				return (0, r.jsx)("div", {
					"data-slot": "card-description",
					className: (0, n.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			function d({ className: e, ...t }) {
				return (0, r.jsx)("div", {
					"data-slot": "card-content",
					className: (0, n.cn)("px-4", e),
					...t,
				});
			}
		},
		81672: (e, t, a) => {
			a.d(t, { Ge: () => u, N0: () => d, Yq: () => l, gQ: () => c, r6: () => o });
			let r = [
					"January",
					"February",
					"March",
					"April",
					"May",
					"June",
					"July",
					"August",
					"September",
					"October",
					"November",
					"December",
				],
				n = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
				s = (e) => String(e).padStart(2, "0");
			function i(e) {
				if (null == e || "" === e) return null;
				if (e instanceof Date) return Number.isNaN(e.getTime()) ? null : e;
				if ("number" == typeof e) {
					let t = new Date(e);
					return Number.isNaN(t.getTime()) ? null : t;
				}
				let t = String(e).trim();
				if (!t) return null;
				let a = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
				if (a) return new Date(Number(a[1]), Number(a[2]) - 1, Number(a[3]));
				let r = new Date(t.includes(" ") && !t.includes("T") ? t.replace(" ", "T") : t);
				return Number.isNaN(r.getTime()) ? null : r;
			}
			function l(e, t = "") {
				let a = i(e);
				return a ? `${s(a.getDate())}/${s(a.getMonth() + 1)}/${a.getFullYear()}` : t;
			}
			function o(e, t = "", a = !1) {
				let r = i(e);
				if (!r) return t;
				let n = `${s(r.getHours())}:${s(r.getMinutes())}${
					a ? `:${s(r.getSeconds())}` : ""
				}`;
				return `${l(r)} ${n}`;
			}
			function d(e, t = "") {
				let a = i(e);
				return a ? `${r[a.getMonth()]} ${a.getFullYear()}` : t;
			}
			function c(e, t = "") {
				let a = i(e);
				return a ? n[a.getDay()] : t;
			}
			function u(e, t = "") {
				let a = i(e);
				return a ? `${n[a.getDay()]}, ${l(a)}` : t;
			}
		},
		95885: (e, t, a) => {
			a.d(t, { BK: () => l, eu: () => i, q5: () => o });
			var r = a(95155);
			a(12115);
			var n = a(84375),
				s = a(91337);
			function i({ className: e, ...t }) {
				return (0, r.jsx)(n.bL, {
					"data-slot": "avatar",
					className: (0, s.cn)(
						"relative flex size-8 shrink-0 overflow-hidden rounded-full",
						e
					),
					...t,
				});
			}
			function l({ className: e, ...t }) {
				return (0, r.jsx)(n._V, {
					"data-slot": "avatar-image",
					className: (0, s.cn)("aspect-square size-full", e),
					...t,
				});
			}
			function o({ className: e, ...t }) {
				return (0, r.jsx)(n.H4, {
					"data-slot": "avatar-fallback",
					className: (0, s.cn)(
						"bg-muted flex size-full items-center justify-center rounded-full",
						e
					),
					...t,
				});
			}
		},
	},
]);
