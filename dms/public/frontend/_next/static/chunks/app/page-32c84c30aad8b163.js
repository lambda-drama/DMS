(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[8974],
	{
		5214: (e, a, r) => {
			"use strict";
			Object.defineProperty(a, "__esModule", { value: !0 }),
				Object.defineProperty(a, "workAsyncStorage", {
					enumerable: !0,
					get: function () {
						return n.workAsyncStorageInstance;
					},
				});
			let n = r(17828);
		},
		17828: (e, a, r) => {
			"use strict";
			Object.defineProperty(a, "__esModule", { value: !0 }),
				Object.defineProperty(a, "workAsyncStorageInstance", {
					enumerable: !0,
					get: function () {
						return n;
					},
				});
			let n = (0, r(64054).createAsyncLocalStorage)();
		},
		21957: (e, a, r) => {
			"use strict";
			function n({ moduleIds: e }) {
				return null;
			}
			Object.defineProperty(a, "__esModule", { value: !0 }),
				Object.defineProperty(a, "PreloadChunks", {
					enumerable: !0,
					get: function () {
						return n;
					},
				}),
				r(95155),
				r(47650),
				r(5214),
				r(2451),
				r(53887);
		},
		35756: (e, a, r) => {
			"use strict";
			r.d(a, { A: () => n });
			let n = (0, r(90425).A)("key-round", [
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
		41015: (e, a, r) => {
			"use strict";
			r.d(a, {
				JK: () => s,
				TK: () => d,
				ec: () => o,
				im: () => c,
				kg: () => l,
				ly: () => i,
			});
			var n = r(49876);
			let t = "dms.api.users";
			async function s() {
				return (0, n.AT)(`/api/method/${t}.get_users_bootstrap`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
			async function l(e) {
				return (0, n.AT)(`/api/method/${t}.create_user`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function d(e) {
				return (0, n.AT)(`/api/method/${t}.update_user`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function i(e) {
				return (0, n.AT)(`/api/method/${t}.set_user_password`, {
					method: "POST",
					body: JSON.stringify(e),
				});
			}
			async function o(e) {
				return (0, n.AT)(`/api/method/${t}.change_password`, {
					method: "POST",
					body: JSON.stringify(e),
				});
			}
			async function c() {
				return (0, n.AT)(`/api/method/${t}.get_password_status`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
		},
		41112: (e, a, r) => {
			"use strict";
			function n({ reason: e, children: a }) {
				return a;
			}
			Object.defineProperty(a, "__esModule", { value: !0 }),
				Object.defineProperty(a, "BailoutToCSR", {
					enumerable: !0,
					get: function () {
						return n;
					},
				}),
				r(1980);
		},
		61846: (e, a, r) => {
			Promise.resolve().then(r.bind(r, 97947));
		},
		64054: (e, a) => {
			"use strict";
			Object.defineProperty(a, "__esModule", { value: !0 });
			var r = {
				bindSnapshot: function () {
					return i;
				},
				createAsyncLocalStorage: function () {
					return d;
				},
				createSnapshot: function () {
					return o;
				},
			};
			for (var n in r) Object.defineProperty(a, n, { enumerable: !0, get: r[n] });
			let t = Object.defineProperty(
				Error(
					"Invariant: AsyncLocalStorage accessed in runtime where it is not available"
				),
				"__NEXT_ERROR_CODE",
				{ value: "E504", enumerable: !1, configurable: !0 }
			);
			class s {
				disable() {
					throw t;
				}
				getStore() {}
				run() {
					throw t;
				}
				exit() {
					throw t;
				}
				enterWith() {
					throw t;
				}
				static bind(e) {
					return e;
				}
			}
			let l = "u" > typeof globalThis && globalThis.AsyncLocalStorage;
			function d() {
				return l ? new l() : new s();
			}
			function i(e) {
				return l ? l.bind(e) : s.bind(e);
			}
			function o() {
				return l
					? l.snapshot()
					: function (e, ...a) {
							return e(...a);
					  };
			}
		},
		68635: (e, a, r) => {
			"use strict";
			Object.defineProperty(a, "__esModule", { value: !0 }),
				Object.defineProperty(a, "default", {
					enumerable: !0,
					get: function () {
						return i;
					},
				});
			let n = r(95155),
				t = r(12115),
				s = r(41112);
			function l(e) {
				return { default: e && "default" in e ? e.default : e };
			}
			r(21957);
			let d = { loader: () => Promise.resolve(l(() => null)), loading: null, ssr: !0 },
				i = function (e) {
					let a = { ...d, ...e },
						r = (0, t.lazy)(() => a.loader().then(l)),
						i = a.loading;
					function o(e) {
						let l = i
								? (0, n.jsx)(i, { isLoading: !0, pastDelay: !0, error: null })
								: null,
							d = !a.ssr || !!a.loading,
							o = d ? t.Suspense : t.Fragment,
							c = a.ssr
								? (0, n.jsxs)(n.Fragment, {
										children: [null, (0, n.jsx)(r, { ...e })],
								  })
								: (0, n.jsx)(s.BailoutToCSR, {
										reason: "next/dynamic",
										children: (0, n.jsx)(r, { ...e }),
								  });
						return (0, n.jsx)(o, { ...(d ? { fallback: l } : {}), children: c });
					}
					return (o.displayName = "LoadableComponent"), o;
				};
		},
		75707: (e, a, r) => {
			"use strict";
			Object.defineProperty(a, "__esModule", { value: !0 }),
				Object.defineProperty(a, "default", {
					enumerable: !0,
					get: function () {
						return t;
					},
				});
			let n = r(73623)._(r(68635));
			function t(e, a) {
				let r = {};
				"function" == typeof e && (r.loader = e);
				let t = { ...r, ...a };
				return (0, n.default)({ ...t, modules: t.loadableGenerated?.modules });
			}
			("function" == typeof a.default ||
				("object" == typeof a.default && null !== a.default)) &&
				void 0 === a.default.__esModule &&
				(Object.defineProperty(a.default, "__esModule", { value: !0 }),
				Object.assign(a.default, a),
				(e.exports = a.default));
		},
		80367: (e, a, r) => {
			"use strict";
			r.d(a, { A: () => n });
			let n = (0, r(90425).A)("shield-off", [
				["path", { d: "m2 2 20 20", key: "1ooewy" }],
				[
					"path",
					{
						d: "M5 5a1 1 0 0 0-1 1v7c0 5 3.5 7.5 7.67 8.94a1 1 0 0 0 .67.01c2.35-.82 4.48-1.97 5.9-3.71",
						key: "1jlk70",
					},
				],
				[
					"path",
					{
						d: "M9.309 3.652A12.252 12.252 0 0 0 11.24 2.28a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1v7a9.784 9.784 0 0 1-.08 1.264",
						key: "18rp1v",
					},
				],
			]);
		},
		97947: (e, a, r) => {
			"use strict";
			r.r(a), r.d(a, { default: () => af });
			var n = r(95155),
				t = r(12115),
				s = r(47277),
				l = r(55833),
				d = r(63360),
				i = r(79790),
				o = r(80367),
				c = r(25261),
				b = r(4474);
			function u({ view: e, children: a }) {
				let { canAccessView: r, canCreate: t, canRead: s, isLoading: i } = (0, d.Sk)(),
					{ navigate: m } = (0, l.c)(),
					p = (0, c.q0)(e),
					h = r("dashboard");
				return i
					? (0, n.jsx)("div", {
							className:
								"flex min-h-[40vh] items-center justify-center text-muted-foreground",
							children: "Loading…",
					  })
					: p && (e.endsWith("-new") ? t(p) : r(e) && s(p))
					? (0, n.jsx)(n.Fragment, { children: a })
					: (0, n.jsxs)("div", {
							className:
								"flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center",
							children: [
								(0, n.jsx)(o.A, { className: "h-12 w-12 text-muted-foreground" }),
								(0, n.jsxs)("div", {
									children: [
										(0, n.jsx)("h2", {
											className: "text-lg font-semibold",
											children: "No access \uD83D\uDD12",
										}),
										(0, n.jsxs)("p", {
											className:
												"mt-1 max-w-md text-sm text-muted-foreground",
											children: [
												"Your role does not have permission to open",
												" ",
												p
													? (0, n.jsx)("strong", {
															children: p.replace(/-/g, " "),
													  })
													: "this section",
												" in DMS. Ask an administrator to update your role permissions in ERPNext.",
											],
										}),
									],
								}),
								h
									? (0, n.jsx)(b.$, {
											variant: "outline",
											onClick: () => m("dashboard"),
											children: "Back to dashboard",
									  })
									: null,
							],
					  });
			}
			var m = r(66609),
				p = r(35756),
				h = r(41313),
				w = r(6296),
				j = r(74350),
				x = r(39658),
				f = r(79792),
				k = r(41015);
			function P({ onChanged: e }) {
				let { logout: a } = (0, s.A)(),
					[r, l] = (0, t.useState)(""),
					[d, i] = (0, t.useState)(""),
					[o, c] = (0, t.useState)(""),
					[u, G] = (0, t.useState)(!1),
					v = o.length > 0 && d !== o,
					y = r.length > 0 && d.length >= 8 && !v;
				async function g(a) {
					if ((a.preventDefault(), d.length < 8))
						return void m.o.error("New password must be at least 8 characters");
					if (d !== o) return void m.o.error("New passwords do not match");
					G(!0);
					try {
						await k.ec({ old_password: r, new_password: d, confirm_password: o }),
							l(""),
							i(""),
							c(""),
							m.o.success("Password updated"),
							e();
					} catch (e) {
						m.o.error(e instanceof Error ? e.message : "Failed to change password");
					} finally {
						G(!1);
					}
				}
				return (0, n.jsx)(j.lG, {
					open: !0,
					children: (0, n.jsxs)(j.Cf, {
						className: "sm:max-w-md",
						showCloseButton: !1,
						onInteractOutside: (e) => e.preventDefault(),
						onPointerDownOutside: (e) => e.preventDefault(),
						onEscapeKeyDown: (e) => e.preventDefault(),
						children: [
							(0, n.jsxs)(j.c7, {
								children: [
									(0, n.jsxs)(j.L3, {
										className: "flex items-center gap-2",
										children: [
											(0, n.jsx)(p.A, { className: "h-5 w-5" }),
											"Set Your Password",
										],
									}),
									(0, n.jsx)(j.rr, {
										children:
											"Your password was set for you. Enter it once, then choose a new password you will use from now on.",
									}),
								],
							}),
							(0, n.jsxs)("form", {
								onSubmit: g,
								className: "space-y-4 py-2",
								children: [
									(0, n.jsxs)("div", {
										className: "space-y-2",
										children: [
											(0, n.jsx)(f.J, {
												htmlFor: "fpc-old",
												children: "Current (temporary) password",
											}),
											(0, n.jsx)(x.p, {
												id: "fpc-old",
												type: "password",
												value: r,
												onChange: (e) => l(e.target.value),
												placeholder:
													"Enter the password you signed in with",
												autoComplete: "current-password",
												autoFocus: !0,
												required: !0,
											}),
										],
									}),
									(0, n.jsxs)("div", {
										className: "space-y-2",
										children: [
											(0, n.jsx)(f.J, {
												htmlFor: "fpc-new",
												children: "New password",
											}),
											(0, n.jsx)(x.p, {
												id: "fpc-new",
												type: "password",
												value: d,
												onChange: (e) => i(e.target.value),
												placeholder: "At least 8 characters",
												autoComplete: "new-password",
												minLength: 8,
												required: !0,
											}),
										],
									}),
									(0, n.jsxs)("div", {
										className: "space-y-2",
										children: [
											(0, n.jsx)(f.J, {
												htmlFor: "fpc-confirm",
												children: "Confirm new password",
											}),
											(0, n.jsx)(x.p, {
												id: "fpc-confirm",
												type: "password",
												value: o,
												onChange: (e) => c(e.target.value),
												placeholder: "Re-enter new password",
												autoComplete: "new-password",
												className: v ? "border-destructive" : "",
												required: !0,
											}),
											v
												? (0, n.jsx)("p", {
														className: "text-xs text-destructive",
														children: "New passwords do not match",
												  })
												: null,
										],
									}),
									(0, n.jsxs)(j.Es, {
										className: "gap-2",
										children: [
											(0, n.jsxs)(b.$, {
												type: "button",
												variant: "outline",
												disabled: u,
												onClick: async () => {
													await a(), window.location.reload();
												},
												children: [
													(0, n.jsx)(h.A, { className: "mr-2 h-4 w-4" }),
													"Sign out",
												],
											}),
											(0, n.jsxs)(b.$, {
												type: "submit",
												disabled: u || !y,
												children: [
													u
														? (0, n.jsx)(w.A, {
																className:
																	"mr-2 h-4 w-4 animate-spin",
														  })
														: null,
													"Update Password",
												],
											}),
										],
									}),
								],
							}),
						],
					}),
				});
			}
			var G = r(75707),
				v = r.n(G),
				y = r(44855);
			let g = v()(() => Promise.all([r.e(5772), r.e(987)]).then(r.bind(r, 80987)), {
					loadableGenerated: { webpack: () => [80987] },
				}),
				_ = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(1108),
							r.e(8091),
							r.e(5772),
							r.e(4804),
							r.e(877),
						]).then(r.bind(r, 60877)),
					{ loadableGenerated: { webpack: () => [60877] } }
				),
				N = v()(
					() =>
						Promise.all([r.e(8091), r.e(6031), r.e(445), r.e(6020), r.e(3680)]).then(
							r.bind(r, 3680)
						),
					{ loadableGenerated: { webpack: () => [3680] } }
				),
				O = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1108),
							r.e(8091),
							r.e(6031),
							r.e(1135),
							r.e(6020),
							r.e(7426),
							r.e(4413),
						]).then(r.bind(r, 91871)),
					{ loadableGenerated: { webpack: () => [91871] } }
				),
				S = v()(
					() =>
						Promise.all([r.e(8091), r.e(6031), r.e(1135), r.e(6020), r.e(4967)]).then(
							r.bind(r, 14967)
						),
					{ loadableGenerated: { webpack: () => [14967] } }
				),
				A = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(8091),
							r.e(6031),
							r.e(9857),
							r.e(6020),
							r.e(2751),
							r.e(1346),
						]).then(r.bind(r, 81346)),
					{ loadableGenerated: { webpack: () => [81346] } }
				),
				C = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1108),
							r.e(8091),
							r.e(6031),
							r.e(4214),
							r.e(6020),
							r.e(7426),
							r.e(1044),
						]).then(r.bind(r, 61044)),
					{ loadableGenerated: { webpack: () => [61044] } }
				),
				T = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(1108),
							r.e(1040),
							r.e(6020),
							r.e(1887),
						]).then(r.bind(r, 24268)),
					{ loadableGenerated: { webpack: () => [24268] } }
				),
				E = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1040),
							r.e(9843),
							r.e(6020),
							r.e(2751),
							r.e(8580),
							r.e(8872),
							r.e(8775),
						]).then(r.bind(r, 98872)),
					{ loadableGenerated: { webpack: () => [98872] } }
				),
				q = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1108),
							r.e(8091),
							r.e(6031),
							r.e(9665),
							r.e(6020),
							r.e(7426),
							r.e(5969),
						]).then(r.bind(r, 58350)),
					{ loadableGenerated: { webpack: () => [58350] } }
				),
				M = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1108),
							r.e(8749),
							r.e(9661),
							r.e(6020),
							r.e(2751),
							r.e(6089),
							r.e(8496),
							r.e(6898),
							r.e(1491),
							r.e(3632),
							r.e(6954),
						]).then(r.bind(r, 6954)),
					{ loadableGenerated: { webpack: () => [6954] } }
				),
				F = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1108),
							r.e(8749),
							r.e(7042),
							r.e(6020),
							r.e(7426),
							r.e(6089),
							r.e(8496),
							r.e(7092),
							r.e(1261),
							r.e(7881),
						]).then(r.bind(r, 20714)),
					{ loadableGenerated: { webpack: () => [20714] } }
				),
				J = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1108),
							r.e(8749),
							r.e(9661),
							r.e(3642),
							r.e(6020),
							r.e(2751),
							r.e(6089),
							r.e(8496),
							r.e(1985),
							r.e(6898),
							r.e(1491),
							r.e(3632),
							r.e(1261),
							r.e(8210),
						]).then(r.bind(r, 78210)),
					{ loadableGenerated: { webpack: () => [78210] } }
				),
				L = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(8749),
							r.e(9843),
							r.e(6020),
							r.e(2751),
							r.e(6089),
							r.e(8496),
							r.e(8580),
							r.e(4074),
						]).then(r.bind(r, 57932)),
					{ loadableGenerated: { webpack: () => [57932] } }
				),
				$ = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1108),
							r.e(6020),
							r.e(7426),
							r.e(1786),
							r.e(9377),
						]).then(r.bind(r, 81786)),
					{ loadableGenerated: { webpack: () => [81786] } }
				),
				D = v()(
					() => Promise.all([r.e(6020), r.e(4512), r.e(9064)]).then(r.bind(r, 24512)),
					{ loadableGenerated: { webpack: () => [24512] } }
				),
				R = v()(
					() =>
						Promise.all([r.e(5139), r.e(878), r.e(1108), r.e(6020), r.e(9599)]).then(
							r.bind(r, 63410)
						),
					{ loadableGenerated: { webpack: () => [63410] } }
				),
				B = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(2680),
							r.e(6020),
							r.e(8972),
						]).then(r.bind(r, 8972)),
					{ loadableGenerated: { webpack: () => [8972] } }
				),
				I = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1108),
							r.e(9544),
							r.e(6020),
							r.e(7426),
							r.e(1985),
							r.e(2474),
						]).then(r.bind(r, 2474)),
					{ loadableGenerated: { webpack: () => [2474] } }
				),
				K = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(8749),
							r.e(796),
							r.e(6020),
							r.e(2751),
							r.e(6089),
							r.e(8496),
							r.e(1491),
							r.e(4844),
						]).then(r.bind(r, 64844)),
					{ loadableGenerated: { webpack: () => [64844] } }
				),
				Y = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1108),
							r.e(3627),
							r.e(1985),
							r.e(5598),
						]).then(r.bind(r, 1435)),
					{ loadableGenerated: { webpack: () => [1435] } }
				),
				z = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(8749),
							r.e(5108),
							r.e(6020),
							r.e(2751),
							r.e(6089),
							r.e(8496),
							r.e(7641),
						]).then(r.bind(r, 57641)),
					{ loadableGenerated: { webpack: () => [57641] } }
				),
				W = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1108),
							r.e(5561),
							r.e(6020),
							r.e(7426),
							r.e(6898),
							r.e(8742),
						]).then(r.bind(r, 66396)),
					{ loadableGenerated: { webpack: () => [66396] } }
				),
				U = v()(
					() => Promise.all([r.e(2763), r.e(6020), r.e(3830)]).then(r.bind(r, 53830)),
					{ loadableGenerated: { webpack: () => [53830] } }
				),
				V = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1108),
							r.e(6020),
							r.e(7426),
							r.e(5863),
							r.e(4167),
						]).then(r.bind(r, 55863)),
					{ loadableGenerated: { webpack: () => [55863] } }
				),
				X = v()(
					() =>
						Promise.all([r.e(5139), r.e(878), r.e(454), r.e(6020), r.e(1504)]).then(
							r.bind(r, 34441)
						),
					{ loadableGenerated: { webpack: () => [34441] } }
				),
				H = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(5476),
							r.e(6020),
							r.e(6212),
							r.e(8596),
						]).then(r.bind(r, 78596)),
					{ loadableGenerated: { webpack: () => [78596] } }
				),
				Q = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(5476),
							r.e(6020),
							r.e(6212),
							r.e(7589),
						]).then(r.bind(r, 97589)),
					{ loadableGenerated: { webpack: () => [97589] } }
				),
				Z = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1980),
							r.e(6020),
							r.e(8051),
							r.e(6629),
						]).then(r.bind(r, 16629)),
					{ loadableGenerated: { webpack: () => [16629] } }
				),
				ee = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1980),
							r.e(6020),
							r.e(8051),
							r.e(9493),
						]).then(r.bind(r, 49493)),
					{ loadableGenerated: { webpack: () => [49493] } }
				),
				ea = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1108),
							r.e(7426),
							r.e(8496),
							r.e(8821),
						]).then(r.bind(r, 41159)),
					{ loadableGenerated: { webpack: () => [41159] } }
				),
				er = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1108),
							r.e(8749),
							r.e(6020),
							r.e(7426),
							r.e(6089),
							r.e(4950),
							r.e(3267),
						]).then(r.bind(r, 34950)),
					{ loadableGenerated: { webpack: () => [34950] } }
				),
				en = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1108),
							r.e(7086),
							r.e(7426),
							r.e(8560),
						]).then(r.bind(r, 8560)),
					{ loadableGenerated: { webpack: () => [8560] } }
				),
				et = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1108),
							r.e(8943),
							r.e(6020),
							r.e(7426),
							r.e(8355),
						]).then(r.bind(r, 88355)),
					{ loadableGenerated: { webpack: () => [88355] } }
				),
				es = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1108),
							r.e(6020),
							r.e(7426),
							r.e(241),
						]).then(r.bind(r, 41492)),
					{ loadableGenerated: { webpack: () => [41492] } }
				),
				el = v()(() => r.e(7689).then(r.bind(r, 57689)), {
					loadableGenerated: { webpack: () => [57689] },
				}),
				ed = v()(() => r.e(9233).then(r.bind(r, 29233)), {
					loadableGenerated: { webpack: () => [29233] },
				}),
				ei = v()(
					() =>
						Promise.all([r.e(5139), r.e(878), r.e(454), r.e(8265), r.e(8967)]).then(
							r.bind(r, 88265)
						),
					{ loadableGenerated: { webpack: () => [88265] } }
				),
				eo = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(5328),
							r.e(3826),
							r.e(3313),
						]).then(r.bind(r, 23826)),
					{ loadableGenerated: { webpack: () => [23826] } }
				),
				ec = v()(
					() =>
						Promise.all([r.e(5139), r.e(878), r.e(454), r.e(5328), r.e(5345)]).then(
							r.bind(r, 8247)
						),
					{ loadableGenerated: { webpack: () => [8247] } }
				),
				eb = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1108),
							r.e(8103),
							r.e(6020),
							r.e(7426),
							r.e(8350),
							r.e(4446),
						]).then(r.bind(r, 48350)),
					{ loadableGenerated: { webpack: () => [48350] } }
				),
				eu = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1108),
							r.e(1040),
							r.e(6178),
							r.e(6020),
							r.e(7426),
							r.e(2751),
							r.e(5347),
						]).then(r.bind(r, 55347)),
					{ loadableGenerated: { webpack: () => [55347] } }
				),
				em = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(3349),
							r.e(6020),
							r.e(2751),
							r.e(473),
						]).then(r.bind(r, 60473)),
					{ loadableGenerated: { webpack: () => [60473] } }
				),
				ep = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(944),
							r.e(6020),
							r.e(9195),
							r.e(9482),
						]).then(r.bind(r, 39482)),
					{ loadableGenerated: { webpack: () => [39482] } }
				),
				eh = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1108),
							r.e(6020),
							r.e(6933),
							r.e(4519),
						]).then(r.bind(r, 69996)),
					{ loadableGenerated: { webpack: () => [69996] } }
				),
				ew = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(6020),
							r.e(6933),
							r.e(7440),
						]).then(r.bind(r, 29161)),
					{ loadableGenerated: { webpack: () => [29161] } }
				),
				ej = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1108),
							r.e(2069),
							r.e(6020),
							r.e(6933),
							r.e(4035),
							r.e(2448),
						]).then(r.bind(r, 92448)),
					{ loadableGenerated: { webpack: () => [92448] } }
				),
				ex = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(1108),
							r.e(4787),
							r.e(4035),
							r.e(3911),
						]).then(r.bind(r, 3911)),
					{ loadableGenerated: { webpack: () => [3911] } }
				),
				ef = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1108),
							r.e(6020),
							r.e(6933),
							r.e(6896),
						]).then(r.bind(r, 42953)),
					{ loadableGenerated: { webpack: () => [42953] } }
				),
				ek = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(7523),
							r.e(6020),
							r.e(2751),
							r.e(8675),
						]).then(r.bind(r, 38675)),
					{ loadableGenerated: { webpack: () => [38675] } }
				),
				eP = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(1108),
							r.e(4889),
							r.e(7426),
							r.e(200),
						]).then(r.bind(r, 20200)),
					{ loadableGenerated: { webpack: () => [20200] } }
				),
				eG = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(8749),
							r.e(4985),
							r.e(6020),
							r.e(2751),
							r.e(6089),
							r.e(8496),
							r.e(3317),
						]).then(r.bind(r, 23317)),
					{ loadableGenerated: { webpack: () => [23317] } }
				),
				ev = v()(
					() => Promise.all([r.e(6020), r.e(9070), r.e(3702)]).then(r.bind(r, 59070)),
					{ loadableGenerated: { webpack: () => [59070] } }
				),
				ey = v()(() => r.e(7311).then(r.bind(r, 37311)), {
					loadableGenerated: { webpack: () => [37311] },
				}),
				eg = v()(() => Promise.all([r.e(8103), r.e(8927)]).then(r.bind(r, 18927)), {
					loadableGenerated: { webpack: () => [18927] },
				}),
				e_ = v()(
					() =>
						Promise.all([r.e(5139), r.e(878), r.e(1108), r.e(8103), r.e(9428)]).then(
							r.bind(r, 59428)
						),
					{ loadableGenerated: { webpack: () => [59428] } }
				),
				eN = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(8103),
							r.e(2751),
							r.e(5505),
							r.e(2079),
							r.e(2062),
						]).then(r.bind(r, 36241)),
					{ loadableGenerated: { webpack: () => [36241] } }
				),
				eO = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(2983),
							r.e(8103),
							r.e(2751),
							r.e(7367),
							r.e(5505),
							r.e(2079),
							r.e(9138),
						]).then(r.bind(r, 69138)),
					{ loadableGenerated: { webpack: () => [69138] } }
				),
				eS = v()(() => Promise.all([r.e(8103), r.e(8930)]).then(r.bind(r, 38930)), {
					loadableGenerated: { webpack: () => [38930] },
				}),
				eA = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(8103),
							r.e(2751),
							r.e(7367),
							r.e(5505),
							r.e(5978),
						]).then(r.bind(r, 29947)),
					{ loadableGenerated: { webpack: () => [29947] } }
				),
				eC = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(3031),
							r.e(8103),
							r.e(2751),
							r.e(7367),
							r.e(5505),
							r.e(6400),
							r.e(3718),
						]).then(r.bind(r, 23718)),
					{ loadableGenerated: { webpack: () => [23718] } }
				),
				eT = v()(() => Promise.all([r.e(8103), r.e(6447)]).then(r.bind(r, 76447)), {
					loadableGenerated: { webpack: () => [76447] },
				}),
				eE = v()(
					() => Promise.all([r.e(8103), r.e(7367), r.e(7880)]).then(r.bind(r, 93602)),
					{ loadableGenerated: { webpack: () => [93602] } }
				),
				eq = v()(() => Promise.all([r.e(8103), r.e(2065)]).then(r.bind(r, 2065)), {
					loadableGenerated: { webpack: () => [2065] },
				}),
				eM = v()(() => Promise.all([r.e(8103), r.e(9160)]).then(r.bind(r, 19160)), {
					loadableGenerated: { webpack: () => [19160] },
				}),
				eF = v()(
					() =>
						Promise.all([r.e(5139), r.e(878), r.e(1108), r.e(8103), r.e(8270)]).then(
							r.bind(r, 58270)
						),
					{ loadableGenerated: { webpack: () => [58270] } }
				),
				eJ = v()(() => Promise.all([r.e(8103), r.e(4839)]).then(r.bind(r, 54839)), {
					loadableGenerated: { webpack: () => [54839] },
				}),
				eL = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(7282),
							r.e(8103),
							r.e(6020),
							r.e(1985),
							r.e(7092),
							r.e(8215),
							r.e(1690),
						]).then(r.bind(r, 61690)),
					{ loadableGenerated: { webpack: () => [61690] } }
				),
				e$ = v()(() => Promise.all([r.e(8103), r.e(3988)]).then(r.bind(r, 63988)), {
					loadableGenerated: { webpack: () => [63988] },
				}),
				eD = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(7282),
							r.e(8103),
							r.e(6020),
							r.e(1985),
							r.e(7092),
							r.e(8215),
							r.e(9464),
						]).then(r.bind(r, 59464)),
					{ loadableGenerated: { webpack: () => [59464] } }
				),
				eR = v()(() => Promise.all([r.e(8103), r.e(400)]).then(r.bind(r, 30400)), {
					loadableGenerated: { webpack: () => [30400] },
				}),
				eB = v()(
					() => Promise.all([r.e(8103), r.e(7367), r.e(2623)]).then(r.bind(r, 2573)),
					{ loadableGenerated: { webpack: () => [2573] } }
				),
				eI = v()(() => Promise.all([r.e(8103), r.e(5028)]).then(r.bind(r, 45028)), {
					loadableGenerated: { webpack: () => [45028] },
				}),
				eK = v()(() => Promise.all([r.e(8103), r.e(8651)]).then(r.bind(r, 18651)), {
					loadableGenerated: { webpack: () => [18651] },
				}),
				eY = v()(() => Promise.all([r.e(8103), r.e(4611)]).then(r.bind(r, 54611)), {
					loadableGenerated: { webpack: () => [54611] },
				}),
				ez = v()(() => Promise.all([r.e(8103), r.e(6934)]).then(r.bind(r, 6934)), {
					loadableGenerated: { webpack: () => [6934] },
				}),
				eW = v()(() => Promise.all([r.e(8103), r.e(6325)]).then(r.bind(r, 96325)), {
					loadableGenerated: { webpack: () => [96325] },
				}),
				eU = v()(() => Promise.all([r.e(8103), r.e(7481)]).then(r.bind(r, 97481)), {
					loadableGenerated: { webpack: () => [97481] },
				}),
				eV = v()(() => Promise.all([r.e(8103), r.e(645)]).then(r.bind(r, 70645)), {
					loadableGenerated: { webpack: () => [70645] },
				}),
				eX = v()(
					() => Promise.all([r.e(8103), r.e(6400), r.e(663)]).then(r.bind(r, 60663)),
					{ loadableGenerated: { webpack: () => [60663] } }
				),
				eH = v()(() => Promise.all([r.e(8103), r.e(6008)]).then(r.bind(r, 6008)), {
					loadableGenerated: { webpack: () => [6008] },
				}),
				eQ = v()(() => Promise.all([r.e(8103), r.e(6764)]).then(r.bind(r, 16764)), {
					loadableGenerated: { webpack: () => [16764] },
				}),
				eZ = v()(() => Promise.all([r.e(8103), r.e(5893)]).then(r.bind(r, 55893)), {
					loadableGenerated: { webpack: () => [55893] },
				}),
				e0 = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(1108),
							r.e(8103),
							r.e(9002),
							r.e(5217),
						]).then(r.bind(r, 49002)),
					{ loadableGenerated: { webpack: () => [49002] } }
				),
				e1 = v()(() => Promise.all([r.e(8103), r.e(1910)]).then(r.bind(r, 51910)), {
					loadableGenerated: { webpack: () => [51910] },
				}),
				e8 = v()(() => Promise.all([r.e(8103), r.e(1569)]).then(r.bind(r, 21569)), {
					loadableGenerated: { webpack: () => [21569] },
				}),
				e4 = v()(
					() => Promise.all([r.e(8103), r.e(7367), r.e(6)]).then(r.bind(r, 61640)),
					{ loadableGenerated: { webpack: () => [61640] } }
				),
				e5 = v()(() => Promise.all([r.e(8103), r.e(5507)]).then(r.bind(r, 5507)), {
					loadableGenerated: { webpack: () => [5507] },
				}),
				e6 = v()(() => Promise.all([r.e(8103), r.e(7996)]).then(r.bind(r, 7996)), {
					loadableGenerated: { webpack: () => [7996] },
				}),
				e7 = v()(
					() => Promise.all([r.e(8103), r.e(7367), r.e(6827)]).then(r.bind(r, 96873)),
					{ loadableGenerated: { webpack: () => [96873] } }
				),
				e3 = v()(() => Promise.all([r.e(8103), r.e(9200)]).then(r.bind(r, 69200)), {
					loadableGenerated: { webpack: () => [69200] },
				}),
				e9 = v()(() => Promise.all([r.e(8103), r.e(2604)]).then(r.bind(r, 62604)), {
					loadableGenerated: { webpack: () => [62604] },
				}),
				e2 = v()(
					() =>
						Promise.all([r.e(5139), r.e(8103), r.e(4823), r.e(1824)]).then(
							r.bind(r, 54823)
						),
					{ loadableGenerated: { webpack: () => [54823] } }
				),
				ae = v()(
					() =>
						Promise.all([r.e(8091), r.e(6031), r.e(4267), r.e(3033)]).then(
							r.bind(r, 54267)
						),
					{ loadableGenerated: { webpack: () => [54267] } }
				),
				aa = v()(() => Promise.all([r.e(8103), r.e(8902)]).then(r.bind(r, 38902)), {
					loadableGenerated: { webpack: () => [38902] },
				}),
				ar = v()(
					() => Promise.all([r.e(8103), r.e(7367), r.e(8865)]).then(r.bind(r, 49679)),
					{ loadableGenerated: { webpack: () => [49679] } }
				),
				an = v()(() => Promise.all([r.e(8103), r.e(7250)]).then(r.bind(r, 47250)), {
					loadableGenerated: { webpack: () => [47250] },
				}),
				at = v()(() => Promise.all([r.e(8103), r.e(9864)]).then(r.bind(r, 49864)), {
					loadableGenerated: { webpack: () => [49864] },
				}),
				as = v()(() => Promise.all([r.e(8103), r.e(8773)]).then(r.bind(r, 78773)), {
					loadableGenerated: { webpack: () => [78773] },
				}),
				al = v()(
					() => Promise.all([r.e(8103), r.e(6668), r.e(2583)]).then(r.bind(r, 66668)),
					{ loadableGenerated: { webpack: () => [66668] } }
				),
				ad = v()(() => Promise.all([r.e(8103), r.e(6414)]).then(r.bind(r, 26414)), {
					loadableGenerated: { webpack: () => [26414] },
				}),
				ai = v()(() => Promise.all([r.e(8103), r.e(9485)]).then(r.bind(r, 19485)), {
					loadableGenerated: { webpack: () => [19485] },
				}),
				ao = v()(
					() => Promise.all([r.e(8103), r.e(7367), r.e(6943)]).then(r.bind(r, 48269)),
					{ loadableGenerated: { webpack: () => [48269] } }
				),
				ac = v()(
					() => Promise.all([r.e(8103), r.e(7367), r.e(2823)]).then(r.bind(r, 55125)),
					{ loadableGenerated: { webpack: () => [55125] } }
				),
				ab = v()(() => Promise.all([r.e(8103), r.e(1671)]).then(r.bind(r, 11671)), {
					loadableGenerated: { webpack: () => [11671] },
				}),
				au = v()(
					() =>
						Promise.all([
							r.e(5139),
							r.e(878),
							r.e(454),
							r.e(944),
							r.e(6020),
							r.e(9195),
							r.e(3144),
						]).then(r.bind(r, 23144)),
					{ loadableGenerated: { webpack: () => [23144] } }
				),
				am = v()(() => r.e(3637).then(r.bind(r, 43637)), {
					loadableGenerated: { webpack: () => [43637] },
				});
			function ap() {
				return (0, n.jsx)("div", {
					className: "flex min-h-screen items-center justify-center bg-background",
					children: (0, n.jsxs)("div", {
						className: "flex flex-col items-center gap-4",
						children: [
							(0, n.jsx)(w.A, { className: "h-8 w-8 animate-spin text-primary" }),
							(0, n.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: "Loading...",
							}),
						],
					}),
				});
			}
			let ah = new Set([
					"dashboard",
					"reports",
					"settings",
					"advanced-permissions",
					"users",
				]),
				aw = [
					"appointments",
					"inspections",
					"service-estimates",
					"job-cards",
					"parts-requisitions",
					"technicians",
					"deliveries",
					"customers",
					"vehicles",
					"invoices",
					"orders",
					"follow-ups",
					"service-advisors",
					"parts-advisors",
					"spare-parts",
					"vehicle-services",
					"vehicle-models",
					"service-packages",
					"item-prices",
					"job-card-terms",
					"sales-invoice-tc",
					"user-permissions",
					"inventory-dashboard",
					"stock-entry",
					"stock-reconciliation",
					"material-request",
					"pending-material-requests",
					"purchase-receipt",
					"spare-part-sales",
					"proforma-invoices",
				];
			function aj() {
				let { activeView: e, navigate: a } = (0, l.c)(),
					{ canAccessView: r, isLoading: n } = (0, d.Sk)();
				return (
					(0, t.useEffect)(() => {
						if (n) return;
						let t = e || "dashboard";
						if (!ah.has(t) || r(t)) return;
						let s = aw.find((e) => r(e));
						s && a(s);
					}, [e, r, n, a]),
					null
				);
			}
			function ax() {
				let { isAuthenticated: e, isLoading: a } = (0, s.A)(),
					{ activeView: r } = (0, l.c)(),
					{ data: t, mutate: d } = (0, y.Ay)(
						e ? "dms-password-status" : null,
						() => k.im(),
						{ revalidateOnFocus: !1 }
					);
				if (a) return (0, n.jsx)(ap, {});
				if (!e) return (0, n.jsx)(g, {});
				let i = () => {
						switch (r) {
							case "dashboard":
							default:
								return (0, n.jsx)(N, {});
							case "appointments":
								return (0, n.jsx)(O, {});
							case "appointment-detail":
								return (0, n.jsx)(S, {});
							case "appointment-new":
								return (0, n.jsx)(A, {});
							case "inspections":
								return (0, n.jsx)(C, {});
							case "inspection-detail":
								return (0, n.jsx)(T, {});
							case "inspection-new":
								return (0, n.jsx)(E, {});
							case "service-estimates":
								return (0, n.jsx)(q, {});
							case "estimate-detail":
								return (0, n.jsx)(M, {});
							case "job-cards":
								return (0, n.jsx)(F, {});
							case "job-card-detail":
								return (0, n.jsx)(J, {});
							case "job-card-new":
								return (0, n.jsx)(L, {});
							case "parts-requisitions":
								return (0, n.jsx)($, {});
							case "parts-requisition-detail":
								return (0, n.jsx)(D, {});
							case "deliveries":
								return (0, n.jsx)(R, {});
							case "delivery-new":
								return (0, n.jsx)(B, {});
							case "invoices":
								return (0, n.jsx)(I, {});
							case "invoice-new":
								return (0, n.jsx)(K, {});
							case "orders":
								return (0, n.jsx)(Y, {});
							case "order-new":
								return (0, n.jsx)(z, {});
							case "payment-entries":
								return (0, n.jsx)(W, {});
							case "reconciliation-hub":
								return (0, n.jsx)(U, {});
							case "follow-ups":
								return (0, n.jsx)(V, {});
							case "follow-up-new":
								return (0, n.jsx)(X, {});
							case "technicians":
								return (0, n.jsx)(H, {});
							case "technician-detail":
								return (0, n.jsx)(Q, {});
							case "service-advisors":
								return (0, n.jsx)(Z, {});
							case "parts-advisors":
								return (0, n.jsx)(ee, {});
							case "spare-parts":
								return (0, n.jsx)(ea, {});
							case "vehicle-services":
								return (0, n.jsx)(er, {});
							case "vehicle-models":
								return (0, n.jsx)(en, {});
							case "service-packages":
								return (0, n.jsx)(et, {});
							case "item-prices":
								return (0, n.jsx)(es, {});
							case "job-card-terms":
								return (0, n.jsx)(el, {});
							case "sales-invoice-tc":
								return (0, n.jsx)(ed, {});
							case "user-permissions":
								return (0, n.jsx)(ei, {});
							case "advanced-permissions":
								return (0, n.jsx)(eo, {});
							case "users":
								return (0, n.jsx)(ec, {});
							case "customers":
								return (0, n.jsx)(eb, {});
							case "vehicles":
								return (0, n.jsx)(eu, {});
							case "vehicle-new":
								return (0, n.jsx)(em, {});
							case "reports":
								return (0, n.jsx)(ep, {});
							case "stock-entry":
								return (0, n.jsx)(eh, {});
							case "stock-reconciliation":
								return (0, n.jsx)(ew, {});
							case "material-request":
								return (0, n.jsx)(ej, {});
							case "pending-material-requests":
								return (0, n.jsx)(ex, {});
							case "purchase-receipt":
								return (0, n.jsx)(ef, {});
							case "spare-part-sales":
								return (0, n.jsx)(ek, {});
							case "proforma-invoices":
								return (0, n.jsx)(eP, {});
							case "proforma-invoice-new":
								return (0, n.jsx)(eG, {});
							case "inventory-dashboard":
								return (0, n.jsx)(ev, {});
							case "settings":
								return (0, n.jsx)(ey, {});
							case "crm-dashboard":
								return (0, n.jsx)(eg, {});
							case "crm-leads":
								return (0, n.jsx)(e_, {});
							case "crm-lead-new":
								return (0, n.jsx)(eN, {});
							case "crm-lead-detail":
								return (0, n.jsx)(eO, {});
							case "crm-opportunities":
								return (0, n.jsx)(eS, {});
							case "crm-opportunity-new":
								return (0, n.jsx)(eA, {});
							case "crm-opportunity-detail":
								return (0, n.jsx)(eC, {});
							case "crm-sales-appointments":
								return (0, n.jsx)(eT, {});
							case "crm-sales-appointment-new":
								return (0, n.jsx)(eE, {});
							case "crm-sales-appointment-detail":
								return (0, n.jsx)(eq, {});
							case "crm-contacts":
								return (0, n.jsx)(eM, {});
							case "crm-customers":
								return (0, n.jsx)(eF, {});
							case "crm-customer-new":
								return (0, n.jsx)(eJ, {});
							case "crm-customer-detail":
								return (0, n.jsx)(eL, {});
							case "crm-vehicles":
								return (0, n.jsx)(e$, {});
							case "crm-vehicle-detail":
								return (0, n.jsx)(eD, {});
							case "crm-activities":
								return (0, n.jsx)(eR, {});
							case "crm-activity-new":
								return (0, n.jsx)(eB, {});
							case "crm-activity-detail":
								return (0, n.jsx)(eI, {});
							case "crm-approvals":
								return (0, n.jsx)(eK, {});
							case "crm-call-logs":
								return (0, n.jsx)(eY, {});
							case "crm-call-log-new":
								return (0, n.jsx)(ez, {});
							case "crm-call-log-detail":
								return (0, n.jsx)(eW, {});
							case "crm-call-center":
								return (0, n.jsx)(eU, {});
							case "crm-test-drives":
								return (0, n.jsx)(eV, {});
							case "crm-test-drive-detail":
								return (0, n.jsx)(eX, {});
							case "crm-delivery-readiness":
								return (0, n.jsx)(eH, {});
							case "crm-delivery-readiness-detail":
								return (0, n.jsx)(eQ, {});
							case "crm-bookings":
								return (0, n.jsx)(eZ, {});
							case "crm-quotations":
								return (0, n.jsx)(e0, {});
							case "crm-quotation-detail":
								return (0, n.jsx)(e1, {});
							case "crm-accounts":
								return (0, n.jsx)(e8, {});
							case "crm-account-new":
								return (0, n.jsx)(e4, {});
							case "crm-account-detail":
								return (0, n.jsx)(e5, {});
							case "crm-tenders":
								return (0, n.jsx)(e6, {});
							case "crm-tender-new":
								return (0, n.jsx)(e7, {});
							case "crm-tender-detail":
								return (0, n.jsx)(e3, {});
							case "crm-fleet-aftersales":
								return (0, n.jsx)(e9, {});
							case "crm-service-retention":
								return (0, n.jsx)(e2, {});
							case "crm-calendar":
								return (0, n.jsx)(ae, {});
							case "crm-cases":
								return (0, n.jsx)(aa, {});
							case "crm-case-new":
								return (0, n.jsx)(ar, {});
							case "crm-case-detail":
								return (0, n.jsx)(an, {});
							case "crm-campaigns":
								return (0, n.jsx)(at, {});
							case "crm-campaign-new":
								return (0, n.jsx)(as, {});
							case "crm-campaign-detail":
								return (0, n.jsx)(al, {});
							case "crm-segment-new":
								return (0, n.jsx)(ad, {});
							case "crm-segment-detail":
								return (0, n.jsx)(ai, {});
							case "crm-loyalty":
								return (0, n.jsx)(ao, {});
							case "crm-referrals":
								return (0, n.jsx)(ac, {});
							case "crm-referral-detail":
								return (0, n.jsx)(ab, {});
							case "crm-reports":
								return (0, n.jsx)(au, {});
							case "crm-staff-audit":
								return (0, n.jsx)(am, {});
						}
					},
					o = (0, l.g)(r || "dashboard")
						? i()
						: (0, n.jsxs)(n.Fragment, {
								children: [
									(0, n.jsx)(aj, {}),
									(0, n.jsx)(u, { view: r || "dashboard", children: i() }),
								],
						  });
				return (0, n.jsxs)(_, {
					children: [
						o,
						t?.must_change_password
							? (0, n.jsx)(P, { onChanged: () => void d() })
							: null,
					],
				});
			}
			function af() {
				return (0, n.jsx)(s.AuthProvider, {
					children: (0, n.jsx)(i.$, {
						children: (0, n.jsx)(l.NavigationProvider, {
							children: (0, n.jsx)(d.wy, { children: (0, n.jsx)(ax, {}) }),
						}),
					}),
				});
			}
		},
	},
	(e) => {
		e.O(0, [8409, 4855, 6609, 410, 7605, 1602, 2372, 5079, 7366, 8441, 3794, 7358], () =>
			e((e.s = 61846))
		),
			(_N_E = e.O());
	},
]);
