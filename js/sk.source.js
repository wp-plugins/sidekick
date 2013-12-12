
/* appModel.js */

/* 1   */ (function($) {
/* 2   */ 
/* 3   */ 	window.SidekickWP = {
/* 4   */ 		Models: {},
/* 5   */ 		Collections: {},
/* 6   */ 		Views: {},
/* 7   */ 		Events: {},
/* 8   */ 		Templates: {},
/* 9   */ 		Helpers: {}
/* 10  */ 	};
/* 11  */ 
/* 12  */ 	if (!window.console) window.console = {log: function() {}};
/* 13  */ 	if (!window.console.clear) window.console.clear = function(){};
/* 14  */ 	if (!window.console.group) window.console.group = function(){};
/* 15  */ 	if (!window.console.groupEnd) window.console.groupEnd = function(){};
/* 16  */ 	if (!window.console.table) window.console.table = function(){};
/* 17  */ 	if (!window.console.error) window.console.error = function(){};
/* 18  */ 	if (!window.console.groupCollapsed) window.console.groupCollapsed = function(){};
/* 19  */ 
/* 20  */ 	if (window.console){
/* 21  */ 		window.console.info = function(msg,o1,o2,o3){if (!o1) o1 = '';if (!o2) o2 = '';if (!o3) o3 = '';console.log('%c' + msg,'color: blue;font-weight: bold',o1,o2,o3);};
/* 22  */ 		window.console.event = function(msg,o1,o2,o3){if (!o1) o1 = '';if (!o2) o2 = '';if (!o3) o3 = '';console.log('%c' + msg,'color: green;font-weight: bold',o1,o2,o3);};
/* 23  */ 	}
/* 24  */ 
/* 25  */ 	SidekickWP.Models.App = Backbone.Model.extend({
/* 26  */ 		defaults: {
/* 27  */ 			full_library:                            null,
/* 28  */ 			library_filtered_hotspots:               null,
/* 29  */ 			library_filtered_walkthroughs:           null,
/* 30  */ 			library_filtered_walkthroughs_by_id:     null,
/* 31  */ 			library_filtered_walkthroughs_by_bucket: null,
/* 32  */ 			library_filtered_buckets:                [],
/* 33  */ 			library_filtered_sub_buckets:            null,
/* 34  */ 			library_filtered_sub_buckets_by_id:      null,
/* 35  */ 			my_library:                              null,
/* 36  */ 			wp_version:                              null,
/* 37  */ 			installed_plugins:                       null,
/* 38  */ 			current_url:                             null,
/* 39  */ 			current_plugin:                          null,
/* 40  */ 			license_status:                          null,
/* 41  */ 			show_toggle_feedback:                    true,
/* 42  */ 			bucket_counts:                           []
/* 43  */ 		},
/* 44  */ 
/* 45  */ 		initialize: function(){
/* 46  */ 			console.group('%cinitialize: App Model %o', 'color:#3b4580', this);
/* 47  */ 
/* 48  */ 			if ( $.browser.msie  && $.browser.version < 9) {
/* 49  */ 				console.error('This browser is not supported');
/* 50  */ 				return false;

/* appModel.js */

/* 51  */ 			}
/* 52  */ 
/* 53  */ 			_.extend(this, Backbone.Events);
/* 54  */ 			SidekickWP.Events = _.extend({}, Backbone.Events);
/* 55  */ 
/* 56  */ 			Sidekick.Events.on('loaded_walkthrough',this.loaded_walkthrough,this);
/* 57  */ 			// Sidekick.Events.on('stop',this.show_review,this);
/* 58  */ 			Sidekick.Events.on('stop',this.deactivate_controls,this);
/* 59  */ 			Sidekick.Events.on('track_play',this.activate_controls,this);
/* 60  */ 			SidekickWP.Events.on('show_msg',this.show_msg,this);
/* 61  */ 
/* 62  */ 			this.trackingModel = new SidekickWP.Models.Tracking();
/* 63  */ 
/* 64  */ 			if (typeof sk_library == 'undefined') {
/* 65  */ 				var msg = 'No Library Found!';
/* 66  */ 				SidekickWP.Events.trigger('track_error',{msg: msg});
/* 67  */ 
/* 68  */ 				console.error('Sidekick Library Not Found! -> %s',sk_library_file);
/* 69  */ 				return;
/* 70  */ 			} else {
/* 71  */ 				console.info('Library -> ' + sk_library_file);
/* 72  */ 				console.log('sk_library %o', sk_library);
/* 73  */ 			}
/* 74  */ 
/* 75  */ 			if (typeof sk_just_activated != 'undefined')
/* 76  */ 				SidekickWP.Events.trigger('window_activate');
/* 77  */ 
/* 78  */ 			if (typeof sk_main_soft_version === 'undefined') {
/* 79  */ 				console.error('No WP Version?!?');
/* 80  */ 				return false;
/* 81  */ 			}
/* 82  */ 
/* 83  */ 			if (typeof sk_main_soft_version != 'undefined') this.set('sk_main_soft_version',sk_main_soft_version);
/* 84  */ 			if (typeof sk_library           != 'undefined') this.set('full_library',sk_library);
/* 85  */ 			if (typeof sk_installed_plugins != 'undefined') this.set('installed_plugins',sk_installed_plugins);
/* 86  */ 
/* 87  */ 			if (sk_track_data === true) console.log("Can't Track User Data!");
/* 88  */ 
/* 89  */ 			// console.table(this.attributes);
/* 90  */ 
/* 91  */ 			console.info('Full Library %o', this.get('full_library'));
/* 92  */ 			this.set('current_url',window.location.toString());
/* 93  */ 
/* 94  */ 			this.Config = {
/* 95  */ 				domain: 'http://www.wpuniversity.com'
/* 96  */ 			};
/* 97  */ 
/* 98  */ 			this.views     = {};
/* 99  */ 
/* 100 */ 			this.check_library();

/* appModel.js */

/* 101 */ 			this.filter_walkthroughs();
/* 102 */ 			this.filter_buckets();
/* 103 */ 			// this.remove_empty_buckets();
/* 104 */ 
/* 105 */ 			this.views.app = new SidekickWP.Views.App({model: this, el: $("body")});
/* 106 */ 
/* 107 */ 			console.groupEnd();
/* 108 */ 		},
/* 109 */ 
/* 110 */ 		filter_walkthroughs: function(){
/* 111 */ 			var library                                 = this.get('full_library');
/* 112 */ 			var check_list                              = [];
/* 113 */ 			var passed_list                             = [];
/* 114 */ 			var library_filtered_walkthroughs_by_id     = [];
/* 115 */ 			var library_filtered_walkthroughs_by_bucket = [];
/* 116 */ 			var library_filtered_hotspots               = [];
/* 117 */ 
/* 118 */ 			console.groupCollapsed('%cCHECK_WALKTHROUGH_COMPATIBILITY %o', 'color:#3b4580', walkthrough);
/* 119 */ 			// console.group('%cCHECK_WALKTHROUGH_COMPATIBILITY %o', 'color:#3b4580', walkthrough);
/* 120 */ 			for(var type in library.walkthroughs){
/* 121 */ 				for(var walkthrough_key in library.walkthroughs[type]){
/* 122 */ 					var walkthrough = library.walkthroughs[type][walkthrough_key];
/* 123 */ 					var check_walkthought = this.check_walkthrough_compatibility(walkthrough);
/* 124 */ 
/* 125 */ 					if (check_walkthought) {
/* 126 */ 						library_filtered_walkthroughs_by_id[walkthrough.id] = walkthrough;
/* 127 */ 
/* 128 */ 						if (walkthrough.type == 'hotspot') {
/* 129 */ 							_.each(walkthrough.hotspots,function(item){
/* 130 */ 								library_filtered_hotspots.push({url:item.url,selector: item.selector,id:walkthrough.id});
/* 131 */ 							});
/* 132 */ 						} else {
/* 133 */ 							for (var bucket in walkthrough.buckets){
/* 134 */ 								var bucket_id = walkthrough.buckets[bucket];
/* 135 */ 								this.assign_walkthrough(bucket_id,walkthrough);
/* 136 */ 
/* 137 */ 								if (typeof library_filtered_walkthroughs_by_bucket[bucket_id] === 'undefined') library_filtered_walkthroughs_by_bucket[bucket_id] = [];
/* 138 */ 								if (typeof library_filtered_walkthroughs_by_bucket[bucket_id][type] === 'undefined') library_filtered_walkthroughs_by_bucket[bucket_id][type] = [];
/* 139 */ 
/* 140 */ 								library_filtered_walkthroughs_by_bucket[bucket_id][type].push(walkthrough);
/* 141 */ 							}
/* 142 */ 						}
/* 143 */ 						if (!_.size(passed_list)) {
/* 144 */ 							passed_list = [walkthrough.id];
/* 145 */ 						} else {
/* 146 */ 							passed_list = _.union(passed_list,walkthrough.id);
/* 147 */ 						}
/* 148 */ 					}
/* 149 */ 				}
/* 150 */ 			}

/* appModel.js */

/* 151 */ 			console.log('passed_list %o', passed_list);
/* 152 */ 			console.log('library_filtered_walkthroughs_by_bucket %o', library_filtered_walkthroughs_by_bucket);
/* 153 */ 
/* 154 */ 			console.groupEnd();
/* 155 */ 
/* 156 */ 			this.set('library_filtered_hotspots',library_filtered_hotspots);
/* 157 */ 			this.set('library_filtered_walkthroughs',passed_list);
/* 158 */ 			this.set('library_filtered_walkthroughs_by_id',library_filtered_walkthroughs_by_id);
/* 159 */ 			this.set('library_filtered_walkthroughs_by_bucket',library_filtered_walkthroughs_by_bucket);
/* 160 */ 		},
/* 161 */ 
/* 162 */ 		assign_walkthrough: function(into_bucket_id,walkthrough){
/* 163 */ 			console.group('%cassign_walkthrough (%s) -> bucket %s', 'color:#8fa2ff',walkthrough.title,into_bucket_id);
/* 164 */ 
/* 165 */ 			var full_library             = this.get('full_library');
/* 166 */ 			var library_filtered_buckets = this.get('library_filtered_buckets');
/* 167 */ 
/* 168 */ 			for (var bucket in full_library.buckets){
/* 169 */ 				var bucket_data = full_library.buckets[bucket];
/* 170 */ 				if (typeof bucket_data.sub_buckets == 'object') {
/* 171 */ 					var sub_buckets = bucket_data.sub_buckets;
/* 172 */ 					for (var sub_bucket in sub_buckets){
/* 173 */ 						var sub_bucket_data = sub_buckets[sub_bucket];
/* 174 */ 
/* 175 */ 						if (typeof sub_bucket_data.sub_buckets == 'object') {
/* 176 */ 							var sub_sub_buckets = sub_bucket_data.sub_buckets;
/* 177 */ 							for (var sub_sub_bucket in sub_sub_buckets){
/* 178 */ 								var sub_sub_bucket_data = sub_sub_buckets[sub_sub_bucket];
/* 179 */ 								if (sub_sub_bucket_data.id == into_bucket_id) {
/* 180 */ 									// console.log('		Assigning (%s) -> (%s)',walkthrough.title,into_bucket_id);
/* 181 */ 									(full_library.buckets[bucket].sub_buckets[sub_bucket].sub_buckets[sub_sub_bucket].walkthroughs = full_library.buckets[bucket].sub_buckets[sub_bucket].sub_buckets[sub_sub_bucket].walkthroughs || []).push(walkthrough);
/* 182 */ 								}
/* 183 */ 							}
/* 184 */ 						} else {
/* 185 */ 							if (sub_bucket_data.id == into_bucket_id) {
/* 186 */ 								// console.log('	Assigning (%s) -> (%s)',walkthrough.title,into_bucket_id);
/* 187 */ 								(full_library.buckets[bucket].sub_buckets[sub_bucket].walkthroughs = full_library.buckets[bucket].sub_buckets[sub_bucket].walkthroughs || []).push(walkthrough);
/* 188 */ 							}
/* 189 */ 						}
/* 190 */ 					}
/* 191 */ 				} else {
/* 192 */ 					if (bucket_data.id == into_bucket_id) {
/* 193 */ 						// console.log('Assigning (%s) -> (%s)',walkthrough.title,into_bucket_id);
/* 194 */ 						(full_library.buckets[bucket].walkthroughs = full_library.buckets[bucket].walkthroughs || []).push(walkthrough);
/* 195 */ 					}
/* 196 */ 				}
/* 197 */ 			}
/* 198 */ 
/* 199 */ 			this.set('library_filtered_buckets',library_filtered_buckets);
/* 200 */ 			console.groupEnd();

/* appModel.js */

/* 201 */ 		},
/* 202 */ 
/* 203 */ 		filter_buckets: function(){
/* 204 */ 			console.groupCollapsed('%cFILTER_BUCKETS', 'color:#8fa2ff');
/* 205 */ 
/* 206 */ 			var full_library             = this.get('full_library');
/* 207 */ 			var library_filtered_sub_buckets = {};
/* 208 */ 			var bucket;
/* 209 */ 			var bucket_data;
/* 210 */ 			var sub_bucket;
/* 211 */ 			var sub_buckets;
/* 212 */ 			var sub_bucket_data;
/* 213 */ 
/* 214 */ 			console.log('LEVEL 3 full_library.buckets %o', full_library.buckets);
/* 215 */ 
/* 216 */ 
/* 217 */ 			for (bucket in full_library.buckets){
/* 218 */ 				console.log('bucket %o', bucket);
/* 219 */ 
/* 220 */ 				bucket_data = full_library.buckets[bucket];
/* 221 */ 
/* 222 */ 				library_filtered_sub_buckets[bucket] = {id:bucket_data.id,sub_buckets:[]};
/* 223 */ 
/* 224 */ 
/* 225 */ 				if (typeof bucket_data.sub_buckets == 'object') {
/* 226 */ 					sub_buckets = bucket_data.sub_buckets;
/* 227 */ 					for (sub_bucket in sub_buckets){
/* 228 */ 						console.log('sub_bucket %o', sub_bucket);
/* 229 */ 
/* 230 */ 						sub_bucket_data = sub_buckets[sub_bucket];
/* 231 */ 
/* 232 */ 						library_filtered_sub_buckets[bucket].sub_buckets[sub_bucket] = {id:sub_bucket_data.id};
/* 233 */ 						library_filtered_sub_buckets[sub_bucket] = {id:sub_bucket_data.id,sub_buckets:[]};
/* 234 */ 
/* 235 */ 
/* 236 */ 						if (typeof sub_bucket_data.sub_buckets == 'object') {
/* 237 */ 							var sub_sub_buckets = sub_bucket_data.sub_buckets;
/* 238 */ 
/* 239 */ 
/* 240 */ 							for (var sub_sub_bucket in sub_sub_buckets){
/* 241 */ 								console.log('sub_sub_bucket %o', sub_sub_bucket);
/* 242 */ 
/* 243 */ 								var sub_sub_bucket_data = sub_sub_buckets[sub_sub_bucket];
/* 244 */ 
/* 245 */ 								library_filtered_sub_buckets[sub_sub_bucket] = {id:sub_sub_bucket_data.id,sub_buckets:[]};
/* 246 */ 								library_filtered_sub_buckets[sub_bucket].sub_buckets[sub_sub_bucket] = {id:sub_sub_bucket_data.id,sub_buckets:[]};
/* 247 */ 
/* 248 */ 								// console.log('sub_sub_bucket %o - %o', sub_sub_bucket,sub_sub_bucket_data);
/* 249 */ 
/* 250 */ 								if (!sub_sub_bucket_data.walkthroughs && !sub_sub_bucket_data.sub_buckets) {

/* appModel.js */

/* 251 */ 									console.log('Deleteing -> %o',full_library.buckets[bucket].sub_buckets[sub_bucket].sub_buckets[sub_sub_bucket]);
/* 252 */ 									delete(full_library.buckets[bucket].sub_buckets[sub_bucket].sub_buckets[sub_sub_bucket]);
/* 253 */ 								}
/* 254 */ 
/* 255 */ 								if (typeof sub_sub_bucket_data.sub_buckets == 'object') {
/* 256 */ 									var sub_sub_sub_buckets = sub_sub_bucket_data.sub_buckets;
/* 257 */ 
/* 258 */ 									for (var sub_sub_sub_bucket in sub_sub_sub_buckets){
/* 259 */ 										console.log('sub_sub_sub_bucket %o', sub_sub_sub_bucket);
/* 260 */ 										var sub_sub_sub_bucket_data = sub_sub_sub_buckets[sub_sub_sub_bucket];
/* 261 */ 										library_filtered_sub_buckets[sub_sub_sub_bucket] = {id:sub_sub_sub_bucket_data.id,sub_buckets:[]};
/* 262 */ 										library_filtered_sub_buckets[sub_sub_bucket].sub_buckets[sub_sub_sub_bucket] = {id:sub_sub_sub_bucket_data.id,sub_buckets:[]};
/* 263 */ 									}
/* 264 */ 								}
/* 265 */ 
/* 266 */ 							}
/* 267 */ 						}
/* 268 */ 					}
/* 269 */ 				}
/* 270 */ 			}
/* 271 */ 
/* 272 */ 			console.log('LEVEL 2 full_library.buckets %o', full_library.buckets);
/* 273 */ 
/* 274 */ 			for (bucket in full_library.buckets){
/* 275 */ 				bucket_data = full_library.buckets[bucket];
/* 276 */ 				if (typeof bucket_data.sub_buckets == 'object') {
/* 277 */ 					sub_buckets = bucket_data.sub_buckets;
/* 278 */ 					for (sub_bucket in sub_buckets){
/* 279 */ 						sub_bucket_data = sub_buckets[sub_bucket];
/* 280 */ 
/* 281 */ 						if (!sub_bucket_data.walkthroughs && !sub_bucket_data.sub_buckets) {
/* 282 */ 							console.log('Deleteing -> %o',sub_bucket);
/* 283 */ 							delete(full_library.buckets[bucket].sub_buckets[sub_bucket]);
/* 284 */ 						}
/* 285 */ 					}
/* 286 */ 				}
/* 287 */ 			}
/* 288 */ 
/* 289 */ 			console.log('LEVEL 1 full_library.buckets %o', full_library.buckets);
/* 290 */ 
/* 291 */ 			for (bucket in full_library.buckets){
/* 292 */ 				bucket_data = full_library.buckets[bucket];
/* 293 */ 				if (!bucket_data.walkthroughs && !bucket_data.sub_buckets) {
/* 294 */ 					console.log('Deleteing -> %o',bucket);
/* 295 */ 					delete(full_library.buckets[bucket]);
/* 296 */ 				}
/* 297 */ 			}
/* 298 */ 
/* 299 */ 			this.set('library_filtered_sub_buckets',library_filtered_sub_buckets);
/* 300 */ 			console.log('full_library.buckets %o', full_library.buckets);

/* appModel.js */

/* 301 */ 			console.groupEnd();
/* 302 */ 		},
/* 303 */ 
/* 304 */ 		check_walkthrough_compatibility: function(walkthrough){
/* 305 */ 			var sk_main_soft_version   = this.get('sk_main_soft_version');
/* 306 */ 			var pass_main_soft_version = false, pass_theme_version = false, pass_theme = false, pass_plugin = false, pass_plugin_version = false, pass_user_level = false;
/* 307 */ 			var bucket_counts          = this.get('bucket_counts');
/* 308 */ 			var installed_plugins      = this.get('installed_plugins') ;
/* 309 */ 
/* 310 */ 			// Checking Main Software Version Compatibility
/* 311 */ 			pass_main_soft_version = _.find(walkthrough.main_soft_version,function(val){
/* 312 */ 				if (val == sk_main_soft_version)
/* 313 */ 					return true;
/* 314 */ 			});
/* 315 */ 
/* 316 */ 			if (!pass_main_soft_version){
/* 317 */ 				console.error('FAILED %o - Main %s != %s',walkthrough.title, pass_main_soft_version,walkthrough.main_soft_version);
/* 318 */ 				console.log('sk_main_soft_version %o walkthrough.main_soft_version %o', sk_main_soft_version,walkthrough.main_soft_version);
/* 319 */ 
/* 320 */ 				return false;
/* 321 */ 			}
/* 322 */ 
/* 323 */ 			// Checking Theme Compatibility
/* 324 */ 			if (typeof walkthrough.theme !== 'undefined') {
/* 325 */ 				if (walkthrough.theme === sk_installed_theme) {
/* 326 */ 					pass_theme = true;
/* 327 */ 					if (walkthrough.theme_version) {
/* 328 */ 						pass_theme_version = _.find(walkthrough.theme_version,function(val){
/* 329 */ 							if (val == sk_theme_version) {
/* 330 */ 								return true;
/* 331 */ 							}
/* 332 */ 						});
/* 333 */ 					} else {
/* 334 */ 						pass_theme_version = true;
/* 335 */ 					}
/* 336 */ 				}
/* 337 */ 				if (!pass_theme || !pass_theme_version){
/* 338 */ 					console.error('FAILED %o - Theme %s (%o) != %s (%o)',walkthrough.title,walkthrough.theme_version, walkthrough.theme, pass_theme, sk_theme_version);
/* 339 */ 					return false;
/* 340 */ 				}
/* 341 */ 			}
/* 342 */ 
/* 343 */ 			// Checking Plugin Compatibility
/* 344 */ 			if (typeof walkthrough.plugin !== 'undefined') {
/* 345 */ 				if (typeof sk_installed_plugins === 'undefined') return false;
/* 346 */ 				pass_plugin = _.find(sk_installed_plugins,function(plugin_data){
/* 347 */ 					for (var plugin in plugin_data) {
/* 348 */ 						var version = plugin_data[plugin];
/* 349 */ 
/* 350 */ 						if (plugin == walkthrough.plugin) {

/* appModel.js */

/* 351 */ 							pass_plugin = true;
/* 352 */ 
/* 353 */ 							pass_plugin_version = _.find(walkthrough.plugin_version,function(version2){
/* 354 */ 								// console.log('version %o == %o ?', version,version2);
/* 355 */ 								if (version == version2) {
/* 356 */ 									pass_plugin_version = true;
/* 357 */ 									return true;
/* 358 */ 								}
/* 359 */ 							});
/* 360 */ 							// console.log('pass_plugin_version %o', pass_plugin_version);
/* 361 */ 							return true;
/* 362 */ 						}
/* 363 */ 						break;
/* 364 */ 					}
/* 365 */ 				});
/* 366 */ 				if (!pass_plugin || !pass_plugin_version){
/* 367 */ 					console.error('FAILED %o - Plugin %o (%o) != %s',walkthrough.title, sk_installed_plugins, walkthrough.plugin_version, walkthrough.plugin);
/* 368 */ 					return false;
/* 369 */ 				}
/* 370 */ 			}
/* 371 */ 
/* 372 */ 			// Checking User Role/Level Compatibility
/* 373 */ 			if (walkthrough.role) {
/* 374 */ 				pass_user_level = _.find(walkthrough.role,function(val){
/* 375 */ 					if (val == sk_user_level) {
/* 376 */ 						return true;
/* 377 */ 					}
/* 378 */ 				});
/* 379 */ 			}
/* 380 */ 
/* 381 */ 			if (!pass_user_level){
/* 382 */ 				console.error('FAILED %o - User Level %s != %s',walkthrough.title, sk_user_level, walkthrough.role);
/* 383 */ 				return false;
/* 384 */ 			}
/* 385 */ 
/* 386 */ 			console.log('%cPASSED! %o', 'color: #3ab00b',walkthrough.title);
/* 387 */ 			return true;
/* 388 */ 		},
/* 389 */ 
/* 390 */ 		check_library: function(){
/* 391 */ 			if (!this.get('full_library')) {
/* 392 */ 				console.error("WPU Library Not Found!");
/* 393 */ 				return false;
/* 394 */ 			}
/* 395 */ 			if (!this.get('sk_main_soft_version')){
/* 396 */ 				console.error("No WP Version Found!");
/* 397 */ 				return false;
/* 398 */ 			}
/* 399 */ 			// this.parse_my_library();
/* 400 */ 		},

/* appModel.js */

/* 401 */ 
/* 402 */ 		loaded_walkthrough: function(walkthrough_model){
/* 403 */ 			// console.log('WPU:loaded_walkthrough');
/* 404 */ 			this.set('last_loaded_walkthrough',walkthrough_model);
/* 405 */ 		},
/* 406 */ 
/* 407 */ 		activate_controls: function(){
/* 408 */ 			console.log('activate_controls');
/* 409 */ 			$('div#sidekick').addClass('playing');
/* 410 */ 		},
/* 411 */ 
/* 412 */ 		deactivate_controls: function(){
/* 413 */ 			$('div#sidekick').removeClass('playing');
/* 414 */ 		},
/* 415 */ 
/* 416 */ 		// show_review: function(a,b){
/* 417 */ 		// 	console.log('show_review');
/* 418 */ 		// 	var last_loaded_walkthrough = this.get('last_loaded_walkthrough');
/* 419 */ 		// 	console.log('last_loaded_walkthrough %o', last_loaded_walkthrough);
/* 420 */ 
/* 421 */ 		// 	var walkthrough_title = last_loaded_walkthrough.get('title');
/* 422 */ 		// 	console.log('walkthrough_title %o', walkthrough_title);
/* 423 */ 
/* 424 */ 		// 	// new SidekickWP.Models.Review({walkthrough_title: walkthrough_title});
/* 425 */ 		// },
/* 426 */ 
/* 427 */ 		show_msg: function(data,context){
/* 428 */ 			// console.log('show_msg %o',arguments);
/* 429 */ 			// console.log('this.models %o', this.models);
/* 430 */ 			// console.log('context %o', context);
/* 431 */ 			new SidekickWP.Models.Message({title: data.title, message: data.msg});
/* 432 */ 		}
/* 433 */ 	});
/* 434 */ }(jQuery));

;
/* bucketContainerModel.js */

/* 1  */ (function($) {
/* 2  */ 
/* 3  */ 	SidekickWP.Models.BucketContainer = Backbone.Model.extend({
/* 4  */ 		defaults: {
/* 5  */ 			navigation_history: ['buckets']
/* 6  */ 		},
/* 7  */ 
/* 8  */ 		initialize: function(){
/* 9  */ 			this.view = new SidekickWP.Views.BucketContainer({model: this});
/* 10 */ 			return this;
/* 11 */ 		}
/* 12 */ 	});
/* 13 */ 
/* 14 */ }(jQuery));

;
/* bucketModel.js */

/* 1  */ (function($) {
/* 2  */ 
/* 3  */ 	SidekickWP.Models.Bucket = Backbone.Model.extend({
/* 4  */ 		defaults: {
/* 5  */ 			full_library:                  null,
/* 6  */ 			library_filtered_walkthroughs: null,
/* 7  */ 			library_filtered_buckets:      null,
/* 8  */ 			library_filtered_sub_buckets:  null
/* 9  */ 		},
/* 10 */ 
/* 11 */ 		initialize: function(){
/* 12 */ 			console.log('initialize bucketModel %o', this.attributes);
/* 13 */ 			this.view = new SidekickWP.Views.Bucket({model: this});
/* 14 */ 			return this;
/* 15 */ 		}
/* 16 */ 	});
/* 17 */ 
/* 18 */ }(jQuery));

;
/* helpers.js */

/* 1  */ (function($) {
/* 2  */ 
/* 3  */ 	SidekickWP.Helpers = ({
/* 4  */ 		preventScrolling: function(){
/* 5  */ 			$('div#sidekick .bucketContainer>div>ul').on('DOMMouseScroll mousewheel', function(ev) {
/* 6  */ 				console.log('asd');
/* 7  */ 				var $this = $(this),
/* 8  */ 				scrollTop = this.scrollTop,
/* 9  */ 				scrollHeight = this.scrollHeight,
/* 10 */ 				height = $this.height(),
/* 11 */ 				delta = (ev.type == 'DOMMouseScroll' ?
/* 12 */ 					ev.originalEvent.detail * -40 :
/* 13 */ 					ev.originalEvent.wheelDelta),
/* 14 */ 				up = delta > 0;
/* 15 */ 
/* 16 */ 				var prevent = function() {
/* 17 */ 					ev.stopPropagation();
/* 18 */ 					ev.preventDefault();
/* 19 */ 					ev.returnValue = false;
/* 20 */ 					return false;
/* 21 */ 				};
/* 22 */ 
/* 23 */ 				if (!up && -delta > scrollHeight - height - scrollTop) {
/* 24 */                     // Scrolling down, but this will take us past the bottom.
/* 25 */                     $this.scrollTop(scrollHeight);
/* 26 */                     return prevent();
/* 27 */                 } else if (up && delta > scrollTop) {
/* 28 */ 					// Scrolling up, but this will take us past the top.
/* 29 */ 					$this.scrollTop(0);
/* 30 */ 					return prevent();
/* 31 */ 				}
/* 32 */ 			});
/* 33 */ 		}
/* 34 */ 	});
/* 35 */ }(jQuery));
/* 36 */ 
/* 37 */ 

;
/* messageModel.js */

/* 1  */ (function($) {
/* 2  */ 
/* 3  */ 	SidekickWP.Models.Message = Backbone.Model.extend({
/* 4  */ 		defaults: {
/* 5  */ 			title: null,
/* 6  */ 			message: null
/* 7  */ 		},
/* 8  */ 
/* 9  */ 		initialize: function(){
/* 10 */ 			this.view = new SidekickWP.Views.Message({model: this, el: $("#sidekick ul.bucketContainer div")});
/* 11 */ 		}
/* 12 */ 	});
/* 13 */ 
/* 14 */ }(jQuery));

;
/* reviewModel.js */

/* 1  */ (function($) {
/* 2  */ 
/* 3  */ 	SidekickWP.Models.Review = Backbone.Model.extend({
/* 4  */ 		defaults: {
/* 5  */ 			walkthrough_title: null
/* 6  */ 		},
/* 7  */ 
/* 8  */ 		initialize: function(){
/* 9  */ 			this.view = new SidekickWP.Views.Review({model: this, el: $("#sidekick .bucketContainer div")});
/* 10 */ 		}
/* 11 */ 	});
/* 12 */ 
/* 13 */ }(jQuery));

;
/* trackingModel.js */

/* 1  */ (function($) {
/* 2  */ 
/* 3  */ 	SidekickWP.Models.Tracking = Backbone.Model.extend({
/* 4  */ 		defaults : {
/* 5  */ 			gaAccountID : 'UA-39283622-1'
/* 6  */ 		},
/* 7  */ 
/* 8  */ 		initialize: function(){
/* 9  */ 			SidekickWP.Events.on('track_open_sidekick_window', this.track_open_sidekick_window, this);
/* 10 */ 			SidekickWP.Events.on('track_explore', this.track_explore, this);
/* 11 */ 			SidekickWP.Events.on('window_activate', this.window_activate, this);
/* 12 */ 			SidekickWP.Events.on('window_deactivate', this.window_deactivate, this);
/* 13 */ 			SidekickWP.Events.on('track_error', this.track_error, this);
/* 14 */ 
/* 15 */ 			window._gaq = window._gaq || [];
/* 16 */ 			window._gaq.push(['sidekickWP._setAccount', this.get('gaAccountID')]);
/* 17 */ 
/* 18 */ 			(function() {
/* 19 */ 				var ga_sk = document.createElement('script'); ga_sk.type = 'text/javascript'; ga_sk.async = true;
/* 20 */ 				ga_sk.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
/* 21 */ 				var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga_sk, s);
/* 22 */ 			})();
/* 23 */ 		},
/* 24 */ 
/* 25 */ 		send: function(data){
/* 26 */ 			model = window.sidekickWP || {};
/* 27 */ 
/* 28 */ 			data = data || {};
/* 29 */ 			data.source = 'plugin';
/* 30 */ 			data.action = 'track';
/* 31 */ 			data.data = JSON.stringify(model);
/* 32 */ 			if (typeof sidekick !== 'undefined' && (typeof sk_track_data === 'undefined' || sk_track_data === true)) {
/* 33 */ 				data.user = sk_license_key;
/* 34 */ 			}
/* 35 */ 
/* 36 */ 			// console.log('send tracking to WPU',data);
/* 37 */ 			$.post("http://www.wpuniversity.com/wp-admin/admin-ajax.php", data);
/* 38 */ 		},
/* 39 */ 
/* 40 */ 		track_explore: function(data){
/* 41 */ 			window._gaq.push(['sidekickWP._trackEvent', 'Plugin - Explore', data.what, null, 0,true]);
/* 42 */ 			this.send({type: 'explore', label: data.what});
/* 43 */ 		},
/* 44 */ 
/* 45 */ 		track_open_sidekick_window: function(data){
/* 46 */ 			window._gaq.push(['sidekickWP._trackEvent', 'Plugin - Window', 'Open', null, 0,true]);
/* 47 */ 			this.send({type: 'open'});
/* 48 */ 		},
/* 49 */ 
/* 50 */ 		window_activate: function(data){

/* trackingModel.js */

/* 51 */ 			window._gaq.push(['sidekickWP._trackEvent', 'Plugin - Activate', '', wpu_plugin_version, 0,true]);
/* 52 */ 			this.send({type: 'activate'});
/* 53 */ 		},
/* 54 */ 
/* 55 */ 		window_deactivate: function(data){
/* 56 */ 			window._gaq.push(['sidekickWP._trackEvent', 'Plugin - Deactivate', '', wpu_plugin_version, 0,true]);
/* 57 */ 			this.send({type: 'deactivate'});
/* 58 */ 		},
/* 59 */ 
/* 60 */ 		track_error: function(data){
/* 61 */ 			window._gaq.push(['sidekickWP._trackEvent', 'Plugin', 'Error', data.msg,null,true]);
/* 62 */ 			this.send({type: 'error', label: data.msg});
/* 63 */ 		}
/* 64 */ 
/* 65 */ 	});
/* 66 */ 
/* 67 */ }(jQuery));
/* 68 */ 
/* 69 */ 
/* 70 */ 

;
/* appView.js */

/* 1   */ (function($) {
/* 2   */ 	SidekickWP.Views.App = Backbone.View.extend({
/* 3   */ 		initialize: function(){
/* 4   */ 			SidekickWP.Events.on('toggle_sidekick_drawer', this.toggle_sidekick_drawer, this);
/* 5   */ 			SidekickWP.Events.on('close_sidekick_drawer',  this.close_sidekick_drawer, this);
/* 6   */ 			SidekickWP.Events.on('open_sidekick_drawer',   this.open_sidekick_drawer, this);
/* 7   */ 			SidekickWP.Events.on('resize_sidekick_drawer', this.resize_sidekick_drawer, this);
/* 8   */ 			SidekickWP.Events.on('toggle_hotspots',        this.toggle_hotspots, this);
/* 9   */ 			SidekickWP.Events.on('toggle_preferences',     this.toggle_preferences, this);
/* 10  */ 
/* 11  */ 
/* 12  */ 			Sidekick.Events.on('track_play',this.toggle_sidekick_drawer,'hide');
/* 13  */ 			Sidekick.Events.on('track_stop',this.show_sidekick_drawer);
/* 14  */ 
/* 15  */ 			return this.render();
/* 16  */ 		},
/* 17  */ 
/* 18  */ 		render: function(){
/* 19  */ 			console.groupEnd('%crender: SidekickWP: appView %o', 'color:#8fa2ff', this);
/* 20  */ 
/* 21  */ 			this.BucketContainer = new SidekickWP.Models.BucketContainer({
/* 22  */ 				full_library:                            this.model.get('full_library'),
/* 23  */ 				library_filtered_walkthroughs:           this.model.get('library_filtered_walkthroughs'),
/* 24  */ 				library_filtered_buckets:                this.model.get('library_filtered_buckets'),
/* 25  */ 				library_filtered_sub_buckets:            this.model.get('library_filtered_sub_buckets'),
/* 26  */ 				library_filtered_walkthroughs_by_bucket: this.model.get('library_filtered_walkthroughs_by_bucket'),
/* 27  */ 				bucket_counts:                           this.model.get('bucket_counts')
/* 28  */ 			});
/* 29  */ 
/* 30  */ 			if (_.size(this.model.get('library_filtered_walkthroughs')) > 0) {
/* 31  */ 				BucketContainer = this.BucketContainer.view.render().$el.html();
/* 32  */ 			} else {
/* 33  */ 				BucketContainer = '<div class="warning">No walkthroughs found for ' + sk_main_soft_name + ' ' + sk_main_soft_version + '</div>';
/* 34  */ 				SidekickWP.Events.trigger('show_msg',{title: "No Walkthroughs", msg: "We're sorry but it looks like there are no walkthroughs compatible with your version of software."},this.model);
/* 35  */ 			}
/* 36  */ 
/* 37  */ 			var template = _.template( SidekickWP.Templates.App, {
/* 38  */ 				BucketContainer: BucketContainer,
/* 39  */ 				hotspots:        $.cookie('sidekick_hotspots')
/* 40  */ 			});
/* 41  */ 			this.$el.append( template );
/* 42  */ 
/* 43  */ 			// this.remove_empty_buckets();
/* 44  */ 
/* 45  */ 			if (!this.model.get('show_toggle_feedback'))
/* 46  */ 				$('#sk_taskbar #toggle_feedback').hide();
/* 47  */ 
/* 48  */ 			SidekickWP.Events.trigger('rendered');
/* 49  */ 			Sidekick.Events.trigger('bind_controls');
/* 50  */ 

/* appView.js */

/* 51  */ 			// this.toggle_sidekick_window();
/* 52  */ 			this.show_hotspots();
/* 53  */ 
/* 54  */ 			$(window).resize(_.debounce(function(){
/* 55  */ 				SidekickWP.Events.trigger('resize_sidekick_drawer');
/* 56  */ 			},500));
/* 57  */ 
/* 58  */ 			console.groupEnd();
/* 59  */ 			return this;
/* 60  */ 		},
/* 61  */ 
/* 62  */ 		events: {
/* 63  */ 			"click #logo,.sk_toggle":    "toggle_sidekick_window",
/* 64  */ 			"click #toggle_drawer":      "toggle_sidekick_drawer",
/* 65  */ 			"click #toggle_hotspots":    "toggle_hotspots",
/* 66  */ 			"click #toggle_preferences": "toggle_preferences",
/* 67  */ 			"click #toggle_feedback":    "show_feedback",
/* 68  */ 			"click #close_sidekick":     "close_sidekick_window"
/* 69  */ 		},
/* 70  */ 
/* 71  */ 		goto_config: function(){
/* 72  */ 			// console.log('goto_config');
/* 73  */ 			window.open('/wp-admin/admin.php?page=sidekick','_self');
/* 74  */ 		},
/* 75  */ 
/* 76  */ 		show_feedback: function(){
/* 77  */ 			console.log('show_feedback');
/* 78  */ 			Sidekick.Events.trigger('show_modal',{title:'Feedback',message: 'Send us some feedback!',primary_button_message: 'Send',secondary_button_message:'Cancel',email:sk_user_email});
/* 79  */ 		},
/* 80  */ 
/* 81  */ 		resize_sidekick_drawer: function(){
/* 82  */ 			console.log('resize_sidekick_drawer %o', $('#sk_drawer').height());
/* 83  */ 
/* 84  */ 			if ($('#sidekick').hasClass('open')) {
/* 85  */ 				if ($('#sk_drawer').height() > 0) {
/* 86  */ 					$('div#sidekick #toggle_drawer').addClass('on');
/* 87  */ 					$('#sk_drawer').css({
/* 88  */ 						height: $('body').height() - 80,
/* 89  */ 						transition: 'all 0.3s ease-in-out'
/* 90  */ 					});
/* 91  */ 					$('#sk_drawer .sk_bucketContainer').css({
/* 92  */ 						height: $('body').height() - 56 - 40,
/* 93  */ 						transition: 'all 0.3s ease-in-out'
/* 94  */ 					});
/* 95  */ 					$('#sk_drawer .sub_bucket').css({
/* 96  */ 						maxHeight: $('body').height() - 137,
/* 97  */ 						transition: 'all 0.3s ease-in-out'
/* 98  */ 					});
/* 99  */ 				}
/* 100 */ 			} else {

/* appView.js */

/* 101 */ 				$('#sk_drawer').height(0);
/* 102 */ 			}
/* 103 */ 		},
/* 104 */ 
/* 105 */ 		show_sidekick_drawer: function(){
/* 106 */ 			$('div#sidekick').addClass('open');
/* 107 */ 			if ($('#sk_drawer').height() === 0) {
/* 108 */ 				$('div#sidekick #toggle_drawer').addClass('on');
/* 109 */ 				$('#sk_drawer').css({
/* 110 */ 					height: $('body').height() - 80,
/* 111 */ 					transition: 'all 0.3s ease-in-out'
/* 112 */ 				});
/* 113 */ 				$('#sk_drawer .sk_bucketContainer').css({
/* 114 */ 					height: $('body').height() - 56 - 40,
/* 115 */ 					transition: 'all 0.3s ease-in-out'
/* 116 */ 				});
/* 117 */ 				$('#sk_drawer .sub_bucket').css({
/* 118 */ 					maxHeight: $('body').height() - 137,
/* 119 */ 					transition: 'all 0.3s ease-in-out'
/* 120 */ 				});
/* 121 */ 			}
/* 122 */ 		},
/* 123 */ 
/* 124 */ 		toggle_preferences: function(){
/* 125 */ 			window.open(sk_plugin_url,'_self');
/* 126 */ 		},
/* 127 */ 
/* 128 */ 		toggle_sidekick_drawer: function(force){
/* 129 */ 			console.log('toggle_sidekick_drawer %o | %o | %o', force,$('#sk_drawer').height(),$('#sidekick').hasClass('open'));
/* 130 */ 
/* 131 */ 			if ($('#sk_drawer').height() > 0 || force == 'hide' || !$('#sidekick').hasClass('open')) {
/* 132 */ 				SidekickWP.Events.trigger('close_sidekick_drawer');
/* 133 */ 			} else {
/* 134 */ 				SidekickWP.Events.trigger('open_sidekick_drawer');
/* 135 */ 			}
/* 136 */ 		},
/* 137 */ 
/* 138 */ 		close_sidekick_drawer: function(){
/* 139 */ 			console.log('Closing Drawer');
/* 140 */ 			$('div#sidekick #toggle_drawer').removeClass('on');
/* 141 */ 			$('#sk_drawer').css({
/* 142 */ 				height: 0,
/* 143 */ 				transition: 'height 0.3s ease-in-out'
/* 144 */ 			});
/* 145 */ 			$('#sk_drawer .sk_bucketContainer').css({
/* 146 */ 				height: 0,
/* 147 */ 				transition: 'height 0.3s ease-in-out'
/* 148 */ 			});
/* 149 */ 		},
/* 150 */ 

/* appView.js */

/* 151 */ 		open_sidekick_drawer: function(){
/* 152 */ 			console.log('Showing Drawer');
/* 153 */ 			$('div#sidekick #toggle_drawer').addClass('on');
/* 154 */ 			$('#sk_drawer').css({
/* 155 */ 				height: $('body').height() - 80,
/* 156 */ 				transition: 'height 0.3s ease-in-out'
/* 157 */ 			});
/* 158 */ 			$('#sk_drawer .sk_bucketContainer').css({
/* 159 */ 				height: $('body').height() - 56 - 40,
/* 160 */ 				transition: 'height 0.3s ease-in-out'
/* 161 */ 			});
/* 162 */ 		},
/* 163 */ 
/* 164 */ 		toggle_sidekick_window: function(e){
/* 165 */ 			console.log('toggle_sidekick_window');
/* 166 */ 
/* 167 */ 			SidekickWP.Events.trigger('track_toggle_sidekick_window');
/* 168 */ 
/* 169 */ 			if ($('div#sidekick').hasClass('open')) {
/* 170 */ 				console.log('Closing Sidekick Window');
/* 171 */ 				SidekickWP.Events.trigger('close_sidekick_drawer');
/* 172 */ 				$('div#sidekick').wait(500).removeClass('open');
/* 173 */ 			} else {
/* 174 */ 				console.log('Showing Sidekick Window');
/* 175 */ 				$('div#sidekick').addClass('open').wait(500,function(e){
/* 176 */ 					SidekickWP.Events.trigger('open_sidekick_drawer');
/* 177 */ 				});
/* 178 */ 			}
/* 179 */ 		},
/* 180 */ 
/* 181 */ 		close_sidekick_window: function(e){
/* 182 */ 			console.log('close_sidekick_window');
/* 183 */ 			if ($('div#sidekick').hasClass('open')) {
/* 184 */ 				SidekickWP.Events.trigger('toggle_sidekick_drawer');
/* 185 */ 				$('div#sidekick').wait(500).removeClass('open');
/* 186 */ 			}
/* 187 */ 		},
/* 188 */ 
/* 189 */ 		toggle_hotspots: function(){
/* 190 */ 			console.log('toggle_hotspots');
/* 191 */ 			if ($('#toggle_hotspots').hasClass('on')) {
/* 192 */ 				console.log('Turning off hotspots');
/* 193 */ 				$('#toggle_hotspots').removeClass('on');
/* 194 */ 				$.cookie('sidekick_hotspots', 0, { expires: 365, path: '/' });
/* 195 */ 				$('.sk_hotspot').parent().remove();
/* 196 */ 			} else {
/* 197 */ 				console.log('Turning on hotspots');
/* 198 */ 				$('#toggle_hotspots').addClass('on');
/* 199 */ 				$.cookie('sidekick_hotspots', 1, { expires: 365, path: '/' });
/* 200 */ 				this.show_hotspots();

/* appView.js */

/* 201 */ 			}
/* 202 */ 		},
/* 203 */ 
/* 204 */ 		show_hotspots: function(){
/* 205 */ 			var hotspots = this.model.get('library_filtered_hotspots');
/* 206 */ 			var url = window.location.toString();
/* 207 */ 			var show_hotspots = $.cookie('sidekick_hotspots');
/* 208 */ 			// console.log('show_hotspots %o', show_hotspots);
/* 209 */ 			// console.log('show_hotspots === true %o', show_hotspots === true);
/* 210 */ 
/* 211 */ 			var count             = 0;
/* 212 */ 			for(var hotspot in hotspots){
/* 213 */ 				var hotspot_data = hotspots[hotspot];
/* 214 */ 
/* 215 */ 				if (url.indexOf(hotspot_data.url) > -1) {
/* 216 */ 					var selectors = hotspot_data.selector;
/* 217 */ 
/* 218 */ 					if ($(selectors).length == 1 && $(selectors).is(':visible')) {
/* 219 */ 						// console.log('hotspot selectors-1 %o', selectors);
/* 220 */ 						count++;
/* 221 */ 					} else if ($(selectors).length > 1){
/* 222 */ 						_.each($(selectors),function(item,key){
/* 223 */ 							if ($(item).length && $(item).is(':visible')) {
/* 224 */ 								// console.log('hotspot selectors-2 %o', item);
/* 225 */ 								count++;
/* 226 */ 							}
/* 227 */ 						});
/* 228 */ 					}
/* 229 */ 				}
/* 230 */ 			}
/* 231 */ 
/* 232 */ 			if (count > 0) {
/* 233 */ 				$('#sidekick #toggle_hotspots').html(count).show();
/* 234 */ 			} else {
/* 235 */ 				$('#sidekick #toggle_hotspots').html(count).hide();
/* 236 */ 			}
/* 237 */ 
/* 238 */ 			if (show_hotspots === '1' || typeof show_hotspots === 'undefined') { // User unspecified default is on
/* 239 */ 				var selector_x        = 'left';
/* 240 */ 				var selector_y        = 'top';
/* 241 */ 				var hotspot_x         = 'right';
/* 242 */ 				var hotspot_y         = 'top';
/* 243 */ 				var hotspot_y_padding = '0';
/* 244 */ 				var hotspot_x_padding = '0';
/* 245 */ 
/* 246 */ 
/* 247 */ 				for(var hotspot in hotspots){
/* 248 */ 					var hotspot_data = hotspots[hotspot];
/* 249 */ 
/* 250 */ 					if (url.indexOf(hotspot_data.url) > -1) {

/* appView.js */

/* 251 */ 						var selectors = hotspot_data.selector;
/* 252 */ 						if ($(selectors).length == 1) {
/* 253 */ 							console.log('%cAttaching Single Hotspot %o -> (%o)','color: #64c541','sk_hotspot_' + hotspot, selectors);
/* 254 */ 							$('body').append('<a href="javascript: sidekick.play(' + hotspot_data.id + ')"><div class="sk_hotspot sk_hotspot_' + hotspot + '" data-target="' + selectors + '"></div></a>');
/* 255 */ 
/* 256 */ 							console.log('selector_x + " " + selector_y %o', selector_x + " " + selector_y);
/* 257 */ 							console.log('hotspot_x + hotspot_x_padding + " " + hotspot_y + hotspot_y_padding %o', hotspot_x + hotspot_x_padding + " " + hotspot_y + hotspot_y_padding);
/* 258 */ 
/* 259 */ 
/* 260 */ 							$('.sk_hotspot_' + hotspot).position({
/* 261 */ 								at: selector_x + " " + selector_y,
/* 262 */ 								my: hotspot_x + hotspot_x_padding + " " + hotspot_y + hotspot_y_padding,
/* 263 */ 								of: $(selectors)
/* 264 */ 							});
/* 265 */ 							$('.sk_hotspot').wait(200*count).addClass('visible');
/* 266 */ 						} else if ($(selectors).length > 1){
/* 267 */ 							_.each($(selectors),function(item,key){
/* 268 */ 								$('body').append('<a href="javascript: sidekick.play(' + hotspot_data.id + ')"><div class="sk_hotspot sk_hotspot_' + hotspot + '_' + key + '" data-target="' + item + '"></div></a>');
/* 269 */ 								console.log('%cAttaching Hotspot #o %o (%o)','color: #64c541',key,'sk_hotspot_' + hotspot + '_' + key, $('.sk_hotspot_' + hotspot + '_' + key));
/* 270 */ 
/* 271 */ 								$('.sk_hotspot_' + hotspot + '_' + key).position({
/* 272 */ 									at: selector_x + " " + selector_y,
/* 273 */ 									my: hotspot_x + hotspot_x_padding + " " + hotspot_y + hotspot_y_padding,
/* 274 */ 								// my: hotspot_x + " " + hotspot_y,
/* 275 */ 								of: item
/* 276 */ 							});
/* 277 */ 								$('.sk_hotspot').wait(200*count).addClass('visible');
/* 278 */ 							});
/* 279 */ 						} else {
/* 280 */ 							msg = "Couldn't attach a hotspot to selector (" + selectors + ")";
/* 281 */ 							Sidekick.Events.trigger('track_error',{model: this, msg: msg});
/* 282 */ 							console.error(msg);
/* 283 */ 						}
/* 284 */ 					}
/* 285 */ 				}
/* 286 */ 
/* 287 */ 			};
/* 288 */ 
/* 289 */ 
/* 290 */ 		}
/* 291 */ 	});
/* 292 */ 
/* 293 */ }(jQuery));
/* 294 */ 
/* 295 */ 
/* 296 */ 
/* 297 */ 

;
/* bucketContainerView.js */

/* 1  */ (function($) {
/* 2  */ 	SidekickWP.Views.BucketContainer = Backbone.View.extend({
/* 3  */ 
/* 4  */ 		initialize: function(models,options){
/* 5  */ 			SidekickWP.Events.on('rendered', this.setup_events, this);
/* 6  */ 			return this;
/* 7  */ 		},
/* 8  */ 
/* 9  */ 		render: function(){
/* 10 */ 			console.group('%crender: render: bucketContainerView %o', 'color:#8fa2ff', this);
/* 11 */ 
/* 12 */ 			SidekickWP.Events.trigger('track_explore',{what:'Bucket - ' + this.model.get('title') });
/* 13 */ 
/* 14 */ 			this.bucket = new SidekickWP.Models.Bucket({
/* 15 */ 				title:                                   this.model.get('title'),
/* 16 */ 				full_library:                            this.model.get('full_library'),
/* 17 */ 				library_filtered_walkthroughs:           this.model.get('library_filtered_walkthroughs'),
/* 18 */ 				library_filtered_buckets:                this.model.get('library_filtered_buckets'),
/* 19 */ 				library_filtered_sub_buckets:            this.model.get('library_filtered_sub_buckets'),
/* 20 */ 				library_filtered_walkthroughs_by_bucket: this.model.get('library_filtered_walkthroughs_by_bucket'),
/* 21 */ 				bucket_counts:                           this.model.get('bucket_counts')
/* 22 */ 			});
/* 23 */ 			this.$el.append(this.bucket.view.render().el);
/* 24 */ 			console.groupEnd();
/* 25 */ 			return this;
/* 26 */ 		},
/* 27 */ 
/* 28 */ 		clicked_bucket: function(e){
/* 29 */ 			console.log('clicked_bucket',e);
/* 30 */ 
/* 31 */ 			var navigation_history = this.model.get('navigation_history');
/* 32 */ 
/* 33 */ 			if ($(e).hasClass('goprev')) {
/* 34 */ 				$('.show').removeClass('show');
/* 35 */ 				navigation_history.pop();
/* 36 */ 				var goto_bucket = navigation_history[navigation_history.length-1];
/* 37 */ 				if (goto_bucket == 'buckets') {
/* 38 */ 					$('[data-bucket_id="' + goto_bucket + '"]').removeClass('hide').addClass('show');
/* 39 */ 				} else {
/* 40 */ 					$('ul.sub_bucket[data-bucket_id="' + goto_bucket + '"]').removeClass('hide').addClass('show');
/* 41 */ 				}
/* 42 */ 
/* 43 */ 			} else if ($(e).data('open_bucket')){
/* 44 */ 				console.log('Showing Bucket %o',$(e).data('open_bucket'));
/* 45 */ 				$(e).parent().removeClass('show').addClass('hide');
/* 46 */ 				$('ul.sub_bucket[data-bucket_id="' + $(e).data('open_bucket') + '"]').addClass('show');
/* 47 */ 				navigation_history.push($(e).data('open_bucket'));
/* 48 */ 			} else {
/* 49 */ 				console.log('Showing Walkthroughs %o',$(e).data('open_walkthroughs'));
/* 50 */ 				$(e).parent().removeClass('show').addClass('hide');

/* bucketContainerView.js */

/* 51 */ 				$('ul.walkthrough[data-bucket_id="' + $(e).data('open_walkthroughs') + '"]').addClass('show');
/* 52 */ 				navigation_history.push($(e).data('open_bucket'));
/* 53 */ 			}
/* 54 */ 			console.log('navigation_history %o', navigation_history);
/* 55 */ 			this.model.set('navigation_history',navigation_history);
/* 56 */ 		},
/* 57 */ 
/* 58 */ 		setup_events: function(){
/* 59 */ 			$('.heading').unbind('click').click({context:this},function(e){
/* 60 */ 				console.log('click');
/* 61 */ 				e.data.context.clicked_bucket(this);
/* 62 */ 			});
/* 63 */ 
/* 64 */ 			$('a.sidekick_play_walkthrough').unbind('click').click({context:this},function(e){
/* 65 */ 				SidekickWP.Events.trigger('close_sidekick_window');
/* 66 */ 			});
/* 67 */ 			// SidekickWP.Helpers.preventScrolling();
/* 68 */ 		}
/* 69 */ 	});
/* 70 */ 
/* 71 */ }(jQuery));
/* 72 */ 
/* 73 */ 

;
/* bucketView.js */

/* 1  */ (function($) {
/* 2  */ 	SidekickWP.Views.Bucket = Backbone.View.extend({
/* 3  */ 
/* 4  */ 		initialize: function(models,options){
/* 5  */ 			return this;
/* 6  */ 		},
/* 7  */ 
/* 8  */ 		render: function(){
/* 9  */ 			console.group('%crender: render: bucketView %o', 'color:#8fa2ff', this);
/* 10 */ 
/* 11 */ 			SidekickWP.Events.trigger('track_explore',{what:'Bucket' });
/* 12 */ 
/* 13 */ 			var variables = {
/* 14 */ 				full_library:                            this.model.get('full_library'),
/* 15 */ 				library_filtered_buckets:                this.model.get('library_filtered_buckets'),
/* 16 */ 				library_filtered_walkthroughs:           this.model.get('library_filtered_walkthroughs'),
/* 17 */ 				library_filtered_sub_buckets:            this.model.get('library_filtered_sub_buckets'),
/* 18 */ 				library_filtered_walkthroughs_by_bucket: this.model.get('library_filtered_walkthroughs_by_bucket'),
/* 19 */ 				bucket_counts:                           this.model.get('bucket_counts'),
/* 20 */ 				sk_plugin_url:                           sk_plugin_url
/* 21 */ 			};
/* 22 */ 
/* 23 */ 			console.log('variables %o', variables);
/* 24 */ 
/* 25 */ 			var template = _.template( SidekickWP.Templates.Bucket, variables );
/* 26 */ 			this.$el.append(template);
/* 27 */ 			console.groupEnd();
/* 28 */ 			return this;
/* 29 */ 		}
/* 30 */ 	});
/* 31 */ 
/* 32 */ }(jQuery));

;
/* messageView.js */

/* 1  */ (function($) {
/* 2  */ 	SidekickWP.Views.Message = Backbone.View.extend({
/* 3  */ 
/* 4  */ 		initialize: function(models,options){
/* 5  */ 			console.group('%crender: render: messageView %o', 'color:#8fa2ff', this);
/* 6  */ 			this.render();
/* 7  */ 			console.groupEnd();
/* 8  */ 			return this;
/* 9  */ 		},
/* 10 */ 
/* 11 */ 		render: function(){
/* 12 */ 
/* 13 */ 			var variables = {
/* 14 */ 				title:   this.model.get('title'),
/* 15 */ 				message: this.model.get('message')
/* 16 */ 			};
/* 17 */ 
/* 18 */ 			var template = _.template( SidekickWP.Templates.Message, variables );
/* 19 */ 
/* 20 */ 			this.$el.append( template );
/* 21 */ 			// SidekickWP.Helpers.preventScrolling();
/* 22 */ 			// SidekickWP.Events.trigger('show_next_pane');
/* 23 */ 
/* 24 */ 			// $('div#sidekick .prev_window').removeClass('prev_window');
/* 25 */ 			// $('div#sidekick #main_menu').addClass('prev_window');
/* 26 */ 			// $('div#sidekick ul.main>li').not('#main_menu,#review').remove();
/* 27 */ 
/* 28 */ 			return this;
/* 29 */ 		}
/* 30 */ 
/* 31 */ 	});
/* 32 */ 
/* 33 */ }(jQuery));

;
/* reviewView.js */

/* 1   */ (function($) {
/* 2   */ 	SidekickWP.Views.Review = Backbone.View.extend({
/* 3   */ 
/* 4   */ 		initialize: function(models,options){
/* 5   */ 			console.group('%cinitialize: Core View %o', 'color:#3b4580', arguments);
/* 6   */ 			this.render();
/* 7   */ 			this.setup_events();
/* 8   */ 			console.groupEnd();
/* 9   */ 			return this;
/* 10  */ 		},
/* 11  */ 
/* 12  */ 		render: function(){
/* 13  */ 			console.group('%crender: render: renderView %o', 'color:#8fa2ff', this);
/* 14  */ 			console.log('SidekickWP.Templates.Review %o', SidekickWP.Templates.Review);
/* 15  */ 
/* 16  */ 			var variables = {
/* 17  */ 				title:   'How did we do?'
/* 18  */ 			};
/* 19  */ 
/* 20  */ 			var template = _.template( SidekickWP.Templates.Review, variables );
/* 21  */ 			console.log('template %o', template);
/* 22  */ 
/* 23  */ 			this.$el.append( template );
/* 24  */ 			// SidekickWP.Helpers.preventScrolling();
/* 25  */ 			// SidekickWP.Events.trigger('show_next_pane');
/* 26  */ 
/* 27  */ 			// $('div#sidekick .prev_window').removeClass('prev_window');
/* 28  */ 			// $('div#sidekick #main_menu').addClass('prev_window');
/* 29  */ 			// $('div#sidekick ul.main>li').not('#main_menu,#review').remove();
/* 30  */ 
/* 31  */ 			return this;
/* 32  */ 		},
/* 33  */ 
/* 34  */ 		events: {
/* 35  */ 			"click input[type='submit']": "submit",
/* 36  */ 			"click div.rate span": "rate"
/* 37  */ 		},
/* 38  */ 
/* 39  */ 		setup_events: function(){
/* 40  */ 			var group_id = this.model.get('id');
/* 41  */ 
/* 42  */ 			$('div#sidekick .review h2 button.goback, #sidekick .review input[type="button"]').unbind('click').click({context:this},function(e){
/* 43  */ 				console.log('click goback/button');
/* 44  */ 				SidekickWP.Events.trigger('show_main_pane');
/* 45  */ 			});
/* 46  */ 
/* 47  */ 			$('div#sidekick .review .rate span').unbind('hover').hover(function(){
/* 48  */ 				$(this).addClass('hover')
/* 49  */ 				.prevAll().addClass('hover');
/* 50  */ 			},function(){

/* reviewView.js */

/* 51  */ 				$('div#sidekick .review .rate span').removeClass('hover');
/* 52  */ 			});
/* 53  */ 
/* 54  */ 			$('div#sidekick .review .rate span').unbind('click').click = this.rate;
/* 55  */ 
/* 56  */ 			$('div#sidekick .review textarea').unbind('click').click(function(){
/* 57  */ 				if(!$(this).hasClass('clicked')){
/* 58  */ 					$(this).addClass('clicked')
/* 59  */ 					.val('');
/* 60  */ 				}
/* 61  */ 			});
/* 62  */ 		},
/* 63  */ 
/* 64  */ 		submit: function(){
/* 65  */ 			var data = {
/* 66  */ 				walkthrough_title: this.model.get('walkthrough_title'),
/* 67  */ 				value:             $('div#sidekick textarea[name="comment"]').val(),
/* 68  */ 				license:           sk_license_key
/* 69  */ 			};
/* 70  */ 
/* 71  */ 			$.ajax({
/* 72  */ 				url:      'http://www.wpuniversity.com/wp-admin/admin-ajax.php?action=wpu_add_comment',
/* 73  */ 				context:  this,
/* 74  */ 				data:     data,
/* 75  */ 				dataType: 'json'
/* 76  */ 			}).done(function(data,e){
/* 77  */ 				console.log('Saved Comment');
/* 78  */ 				$('div#sidekick textarea').html('Thank You!');
/* 79  */ 				$('div#sidekick .review input[type="submit"]').val('Sent!');
/* 80  */ 				setTimeout(SidekickWP.Events.trigger('show_main_pane'),3000);
/* 81  */ 			}).error(function(e){
/* 82  */ 				console.error('Comment Save error (%o)',e);
/* 83  */ 			});
/* 84  */ 		},
/* 85  */ 
/* 86  */ 		rate: function(e){
/* 87  */ 			var data = {
/* 88  */ 				walkthrough_title: this.model.get('walkthrough_title'),
/* 89  */ 				rating:            $(e.currentTarget).data('val'),
/* 90  */ 				license:           sk_license_key
/* 91  */ 			};
/* 92  */ 
/* 93  */ 			$(e.currentTarget).addClass('saved')
/* 94  */ 			.prevAll().addClass('saved');
/* 95  */ 
/* 96  */ 			$('div#sidekick .rate span').unbind('mouseenter mouseleave click').css({cursor: 'default'});
/* 97  */ 
/* 98  */ 			$.ajax({
/* 99  */ 				url:      'http://www.wpuniversity.com/wp-admin/admin-ajax.php?action=wpu_add_rating',
/* 100 */ 				context:  this,

/* reviewView.js */

/* 101 */ 				data:     data,
/* 102 */ 				dataType: 'json'
/* 103 */ 			}).done(function(data,e){
/* 104 */ 				console.log('Saved Rating');
/* 105 */ 				$('div#sidekick .hover').addClass('saved');
/* 106 */ 
/* 107 */ 			}).error(function(e){
/* 108 */ 				console.error('Rating Save error (%o)',e);
/* 109 */ 			});
/* 110 */ 
/* 111 */ 		}
/* 112 */ 
/* 113 */ 	});
/* 114 */ 
/* 115 */ }(jQuery));

;
/* templates.js */

/* 1   */ _.templateSettings.interpolate = /\{\{(.*?)\}\}/;
/* 2   */ 
/* 3   */ SidekickWP.Templates.App = [
/* 4   */ 	"<div id='sidekick' class='sidekick_player'>",
/* 5   */ 		"<div id='sk_taskbar'>",
/* 6   */ 			"<div id='logo'></div>",
/* 7   */ 			"<button class='sk_toggle'></button>",
/* 8   */ 			"<div class='sk_controls'>",
/* 9   */ 				"<button class='sidekick_restart'></button>",
/* 10  */ 				"<button class='sidekick_play_pause'></button>",
/* 11  */ 				"<button class='sidekick_stop'></button>",
/* 12  */ 			"</div>",
/* 13  */ 			"<div class='sk_toggles'>",
/* 14  */ 				// "<% console.log('hotspots %o',hotspots);%>",
/* 15  */ 				"<button id='toggle_hotspots' <% if (hotspots === '1' || typeof hotspots === 'undefined'){%>class='on'<% } %> alt='Number of hotspots'>0</button>",
/* 16  */ 				"<button id='toggle_feedback'></button>",
/* 17  */ 				"<button id='toggle_preferences'></button>",
/* 18  */ 				"<button id='toggle_drawer'><i></i></button>",
/* 19  */ 			"</div>",
/* 20  */ 			"<div class='sk_info'>",
/* 21  */ 				"<div class='sk_time'>0:00/0:00</div>",
/* 22  */ 				"<div class='sk_title'><label>Now Playing</label><span class='sk_walkthrough_title'></span></div>",
/* 23  */ 			"</div>",
/* 24  */ 		"</div>",
/* 25  */ 		"<div id='sk_drawer'>",
/* 26  */ 			"<h2>Walkthroughs<button id='close_sidekick'></button></h2>",
/* 27  */ 			"<ul class='sk_bucketContainer'>",
/* 28  */ 				"<% print(BucketContainer) %>",
/* 29  */ 			"</ul>",
/* 30  */ 		"</div>",
/* 31  */ 	"</div>"
/* 32  */ ].join("");
/* 33  */ 
/* 34  */ SidekickWP.Templates.Bucket = [
/* 35  */ 	"<ul class='buckets' data-bucket_id='buckets'>",
/* 36  */ 		"<% _.each(full_library.buckets, function(bucket_data, bucket_title){ %>",
/* 37  */ 			// "<% console.log('primary bucket %o(%o) %o',bucket_title,bucket_data.id,bucket_data);%>",
/* 38  */ 			"<li class='heading bucket_heading' <% if (bucket_data.sub_buckets){ %> data-open_bucket='<% print(bucket_data.id) %>' <% } else { %> data-open_walkthroughs='<% print(bucket_data.id) %>' <% } %> ><span><% print(bucket_title) %></span><i></i></li>",
/* 39  */ 		"<% }); %>",
/* 40  */ 	"</ul>",
/* 41  */ 
/* 42  */ 	"<% var already_done = []; %>",
/* 43  */ 
/* 44  */ 	"<ul class='sub_buckets'>",
/* 45  */ 		"<% _.each(full_library.buckets, function(bucket_data,bucket_title){ %>",
/* 46  */ 			// "<% console.log('level-1(%s) %o %o',bucket_data.id,bucket_title,bucket_data);%>",
/* 47  */ 			"<ul class='sub_bucket' data-bucket_id='<% print(bucket_data.id) %>'>",
/* 48  */ 				"<% already_done[bucket_data.id] = true; %>",
/* 49  */ 				"<li class='heading goprev'><span><% print(bucket_title) %></span><i></i></li>",
/* 50  */ 				"<% _.each(bucket_data.sub_buckets, function(sub_bucket_data){ %>",

/* templates.js */

/* 51  */ 					// "<% console.log('sub-bucket(%s) %o %o',sub_bucket_data.id,full_library.all_buckets_by_id[sub_bucket_data.id],sub_bucket_data);%>",
/* 52  */ 					"<li class='heading sub_bucket_heading level1a' <% if (sub_bucket_data.sub_buckets){ %> data-open_bucket='<% print(sub_bucket_data.id) %>' <% } else { %> data-open_walkthroughs='<% print(sub_bucket_data.id) %>' <% } %>><span><% print(full_library.all_buckets_by_id[sub_bucket_data.id]) %></span><i></i></li>",
/* 53  */ 				"<% }); %>",
/* 54  */ 			"</ul>",
/* 55  */ 		"<% }); %>",
/* 56  */ 
/* 57  */ 		"<% _.each(full_library.buckets, function(bucket_data,bucket_title){ %>",
/* 58  */ 			"<% _.each(bucket_data.sub_buckets, function(sub_bucket_data){ %>",
/* 59  */ 				"<% if (sub_bucket_data.sub_buckets && !already_done[sub_bucket_data.id]) { %>",
/* 60  */ 					// "<% console.log('level-2(%s) %o %o',sub_bucket_data.id,full_library.all_buckets_by_id[sub_bucket_data.id],sub_bucket_data);%>",
/* 61  */ 					"<% already_done[sub_bucket_data.id] = true; %>",
/* 62  */ 					"<ul class='sub_bucket sub_sub_bucket' data-bucket_id='<% print(sub_bucket_data.id) %>'>",
/* 63  */ 						"<li class='heading goprev'><span><% print(full_library.all_buckets_by_id[sub_bucket_data.id]) %></span><i></i></li>",
/* 64  */ 						"<% _.each(sub_bucket_data.sub_buckets, function(sub_sub_bucket_data){ %>",
/* 65  */ 							// "<% console.log('sub-bucket-2(%s) %o %o',sub_sub_bucket_data.id,full_library.all_buckets_by_id[sub_sub_bucket_data.id],sub_sub_bucket_data);%>",
/* 66  */ 							"<li class='heading sub_bucket_heading level1b' <% if (sub_sub_bucket_data.sub_buckets){ %> data-open_bucket='<% print(sub_sub_bucket_data.id) %>' <% } else { %> data-open_walkthroughs='<% print(sub_sub_bucket_data.id) %>' <% } %> ><span><% print(full_library.all_buckets_by_id[sub_sub_bucket_data.id]) %></span><i></i></li>",
/* 67  */ 						"<% }); %>",
/* 68  */ 					"</ul>",
/* 69  */ 				"<% } %>",
/* 70  */ 			"<% }); %>",
/* 71  */ 		"<% }); %>",
/* 72  */ 
/* 73  */ 		"<% _.each(full_library.buckets, function(bucket_data,bucket_title){ %>",
/* 74  */ 			"<% _.each(bucket_data.sub_buckets, function(sub_bucket_data){ %>",
/* 75  */ 				"<% _.each(sub_bucket_data.sub_buckets, function(sub_sub_bucket_data){ %>",
/* 76  */ 					"<% if (sub_sub_bucket_data.sub_buckets && !already_done[sub_sub_bucket_data.id]) { %>",
/* 77  */ 						// "<% console.log('level-3(%s) %o %o',sub_sub_bucket_data.id,full_library.all_buckets_by_id[sub_sub_bucket_data.id],sub_sub_bucket_data);%>",
/* 78  */ 						"<ul class='sub_bucket sub_sub_bucket' data-bucket_id='<% print(sub_sub_bucket_data.id) %>'>",
/* 79  */ 							"<li class='heading goprev'><span><% print(full_library.all_buckets_by_id[sub_sub_bucket_data.id]) %></span><i></i></li>",
/* 80  */ 							"<% _.each(sub_sub_bucket_data.sub_buckets, function(sub_sub_sub_bucket_data){ %>",
/* 81  */ 								// "<% console.log('sub-bucket-3(%s) %o %o',sub_sub_sub_bucket_data.id,full_library.all_buckets_by_id[sub_sub_sub_bucket_data.id],sub_sub_sub_bucket_data);%>",
/* 82  */ 								"<li class='heading sub_bucket_heading level1b' <% if (sub_sub_sub_bucket_data.sub_buckets){ %> data-open_bucket='<% print(sub_sub_sub_bucket_data.id) %>' <% } else { %> data-open_walkthroughs='<% print(sub_sub_sub_bucket_data.id) %>' <% } %> ><span><% print(full_library.all_buckets_by_id[sub_sub_sub_bucket_data.id]) %></span><i></i></li>",
/* 83  */ 							"<% }); %>",
/* 84  */ 						"</ul>",
/* 85  */ 					"<% } %>",
/* 86  */ 				"<% }); %>",
/* 87  */ 			"<% }); %>",
/* 88  */ 		"<% }); %>",
/* 89  */ 	"</ul>",
/* 90  */ 
/* 91  */ 	"<ul class='walkthroughs'>",
/* 92  */ 		"<% _.each(library_filtered_walkthroughs_by_bucket, function(bucket_data, bucket_id){ %>",
/* 93  */ 			// "<% console.log('bucket_data %o',bucket_data);%>",
/* 94  */ 			// "<% console.log('bucket_id %o',bucket_id);%>",
/* 95  */ 			"<ul class='walkthrough' data-bucket_id='<% print(bucket_id) %>'>",
/* 96  */ 				"<li class='heading goprev'><span><% print(full_library.all_buckets_by_id[bucket_id]) %></span><i></i></li>",
/* 97  */ 				"<ul class='walkthroughs_inner' data-bucket_id='<% print(bucket_id) %>'>",
/* 98  */ 					"<% _.each(bucket_data.overview, function(walkthrough, walkthrough_key){ %>",
/* 99  */ 						"<a href='javascript: sidekick.play(<% print(walkthrough.id) %>)'><li class='overview'><% print(walkthrough.title) %></li></a>",
/* 100 */ 					"<% }); %>",

/* templates.js */

/* 101 */ 					"<% _.each(bucket_data.how, function(walkthrough, walkthrough_key){ %>",
/* 102 */ 						"<a href='javascript: sidekick.play(<% print(walkthrough.id) %>)'><li class='how'><% print(walkthrough.title) %></li></a>",
/* 103 */ 					"<% }); %>",
/* 104 */ 				"</ul>",
/* 105 */ 			"</ul>",
/* 106 */ 		"<% }); %>",
/* 107 */ 	"</ul>"
/* 108 */ ].join("");
/* 109 */ 
/* 110 */ SidekickWP.Templates.Review = [
/* 111 */ 	"<ul class='new_window review' data-title='<% print(title) %>'>",
/* 112 */ 		"<li>",
/* 113 */ 			"<div><div class='rate'><span data-val='1' class='rate1'></span><span data-val='2' class='rate2'></span><span data-val='3' class='rate3'></span><span data-val='4' class='rate4'></span><span data-val='5' class='rate5'></span></div>",
/* 114 */ 			"<textarea name='comment'>Let us know if you found the Walkthrough helpful or if we can improve something.</textarea>",
/* 115 */ 			"<br/><input type='button' value='Skip'></input><input type='submit' value='Submit'></input>",
/* 116 */ 		"</li>",
/* 117 */ 	"</ul>"
/* 118 */ ].join("");
/* 119 */ 
/* 120 */ 
/* 121 */ SidekickWP.Templates.Message = [
/* 122 */ 	"<ul class='new_window message' data-title='<% print(title) %>'>",
/* 123 */ 		"<li>",
/* 124 */ 			"<div><% print(message) %></div>",
/* 125 */ 		"</li>",
/* 126 */ 	"</ul>"
/* 127 */ ].join("");
/* 128 */ 
/* 129 */ 

;
/* jquery.lightbox_me.js */

/* 1   */ /*
/* 2   *| * $ lightbox_me
/* 3   *| * By: Buck Wilson
/* 4   *| * Version : 2.3
/* 5   *| *
/* 6   *| * Licensed under the Apache License, Version 2.0 (the "License");
/* 7   *| * you may not use this file except in compliance with the License.
/* 8   *| * You may obtain a copy of the License at
/* 9   *| *
/* 10  *| *     http://www.apache.org/licenses/LICENSE-2.0
/* 11  *| *
/* 12  *| * Unless required by applicable law or agreed to in writing, software
/* 13  *| * distributed under the License is distributed on an "AS IS" BASIS,
/* 14  *| * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/* 15  *| * See the License for the specific language governing permissions and
/* 16  *| * limitations under the License.
/* 17  *| */
/* 18  */ 
/* 19  */ 
/* 20  */ (function($) {
/* 21  */ 
/* 22  */     $.fn.lightbox_me = function(options) {
/* 23  */ 
/* 24  */         return this.each(function() {
/* 25  */ 
/* 26  */             var
/* 27  */                 opts = $.extend({}, $.fn.lightbox_me.defaults, options),
/* 28  */                 $overlay = $(),
/* 29  */                 $self = $(this),
/* 30  */                 $iframe = $('<iframe id="foo" style="z-index: ' + (opts.zIndex + 1) + ';border: none; margin: 0; padding: 0; position: absolute; width: 100%; height: 100%; top: 0; left: 0; filter: mask();"/>'),
/* 31  */                 ie6 = ($.browser.msie && $.browser.version < 7);
/* 32  */ 
/* 33  */             if (opts.showOverlay) {
/* 34  */                 //check if there's an existing overlay, if so, make subequent ones clear
/* 35  */                var $currentOverlays = $(".js_lb_overlay:visible");
/* 36  */                 if ($currentOverlays.length > 0){
/* 37  */                     $overlay = $('<div class="lb_overlay_clear js_lb_overlay"/>');
/* 38  */                 } else {
/* 39  */                     $overlay = $('<div class="' + opts.classPrefix + '_overlay js_lb_overlay"/>');
/* 40  */                 }
/* 41  */             }
/* 42  */ 
/* 43  */             /*----------------------------------------------------
/* 44  *|                DOM Building
/* 45  *|             ---------------------------------------------------- */
/* 46  */             if (ie6) {
/* 47  */                 var src = /^https/i.test(window.location.href || '') ? 'javascript:false' : 'about:blank';
/* 48  */                 $iframe.attr('src', src);
/* 49  */                 $('body').append($iframe);
/* 50  */             } // iframe shim for ie6, to hide select elements

/* jquery.lightbox_me.js */

/* 51  */             $('body').append($self.hide()).append($overlay);
/* 52  */ 
/* 53  */ 
/* 54  */             /*----------------------------------------------------
/* 55  *|                Overlay CSS stuffs
/* 56  *|             ---------------------------------------------------- */
/* 57  */ 
/* 58  */             // set css of the overlay
/* 59  */             if (opts.showOverlay) {
/* 60  */                 setOverlayHeight(); // pulled this into a function because it is called on window resize.
/* 61  */                 $overlay.css({ position: 'absolute', width: '100%', top: 0, left: 0, right: 0, bottom: 0, zIndex: (opts.zIndex + 2), display: 'none' });
/* 62  */ 				if (!$overlay.hasClass('lb_overlay_clear')){
/* 63  */                 	$overlay.css(opts.overlayCSS);
/* 64  */                 }
/* 65  */             }
/* 66  */ 
/* 67  */             /*----------------------------------------------------
/* 68  *|                Animate it in.
/* 69  *|             ---------------------------------------------------- */
/* 70  */                //
/* 71  */             if (opts.showOverlay) {
/* 72  */                 $overlay.fadeIn(opts.overlaySpeed, function() {
/* 73  */                     setSelfPosition();
/* 74  */                     $self[opts.appearEffect](opts.lightboxSpeed, function() { setOverlayHeight(); setSelfPosition(); opts.onLoad()});
/* 75  */                 });
/* 76  */             } else {
/* 77  */                 setSelfPosition();
/* 78  */                 $self[opts.appearEffect](opts.lightboxSpeed, function() { opts.onLoad()});
/* 79  */             }
/* 80  */ 
/* 81  */             /*----------------------------------------------------
/* 82  *|                Hide parent if parent specified (parentLightbox should be jquery reference to any parent lightbox)
/* 83  *|             ---------------------------------------------------- */
/* 84  */             if (opts.parentLightbox) {
/* 85  */                 opts.parentLightbox.fadeOut(200);
/* 86  */             }
/* 87  */ 
/* 88  */ 
/* 89  */             /*----------------------------------------------------
/* 90  *|                Bind Events
/* 91  *|             ---------------------------------------------------- */
/* 92  */ 
/* 93  */             $(window).resize(setOverlayHeight)
/* 94  */                      .resize(setSelfPosition)
/* 95  */                      .scroll(setSelfPosition);
/* 96  */                      
/* 97  */             $(window).bind('keyup.lightbox_me', observeKeyPress);
/* 98  */                      
/* 99  */             if (opts.closeClick) {
/* 100 */                 $overlay.click(function(e) { closeLightbox(); e.preventDefault; });

/* jquery.lightbox_me.js */

/* 101 */             }
/* 102 */             $self.delegate(opts.closeSelector, "click", function(e) {
/* 103 */                 closeLightbox(); e.preventDefault();
/* 104 */             });
/* 105 */             $self.bind('close', closeLightbox);
/* 106 */             $self.bind('reposition', setSelfPosition);
/* 107 */ 
/* 108 */             
/* 109 */ 
/* 110 */             /*--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/* 111 *|               -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
/* 112 */ 
/* 113 */ 
/* 114 */             /*----------------------------------------------------
/* 115 *|                Private Functions
/* 116 *|             ---------------------------------------------------- */
/* 117 */ 
/* 118 */             /* Remove or hide all elements */
/* 119 */             function closeLightbox() {
/* 120 */                 var s = $self[0].style;
/* 121 */                 if (opts.destroyOnClose) {
/* 122 */                     $self.add($overlay).remove();
/* 123 */                 } else {
/* 124 */                     $self.add($overlay).hide();
/* 125 */                 }
/* 126 */ 
/* 127 */                 //show the hidden parent lightbox
/* 128 */                 if (opts.parentLightbox) {
/* 129 */                     opts.parentLightbox.fadeIn(200);
/* 130 */                 }
/* 131 */ 
/* 132 */                 $iframe.remove();
/* 133 */                 
/* 134 */ 				// clean up events.
/* 135 */                 $self.undelegate(opts.closeSelector, "click");
/* 136 */ 
/* 137 */                 $(window).unbind('reposition', setOverlayHeight);
/* 138 */                 $(window).unbind('reposition', setSelfPosition);
/* 139 */                 $(window).unbind('scroll', setSelfPosition);
/* 140 */                 $(window).unbind('keyup.lightbox_me');
/* 141 */                 if (ie6)
/* 142 */                     s.removeExpression('top');
/* 143 */                 opts.onClose();
/* 144 */             }
/* 145 */ 
/* 146 */ 
/* 147 */             /* Function to bind to the window to observe the escape/enter key press */
/* 148 */             function observeKeyPress(e) {
/* 149 */                 if((e.keyCode == 27 || (e.DOM_VK_ESCAPE == 27 && e.which==0)) && opts.closeEsc) closeLightbox();
/* 150 */             }

/* jquery.lightbox_me.js */

/* 151 */ 
/* 152 */ 
/* 153 */             /* Set the height of the overlay
/* 154 *|                     : if the document height is taller than the window, then set the overlay height to the document height.
/* 155 *|                     : otherwise, just set overlay height: 100%
/* 156 *|             */
/* 157 */             function setOverlayHeight() {
/* 158 */                 if ($(window).height() < $(document).height()) {
/* 159 */                     $overlay.css({height: $(document).height() + 'px'});
/* 160 */                      $iframe.css({height: $(document).height() + 'px'}); 
/* 161 */                 } else {
/* 162 */                     $overlay.css({height: '100%'});
/* 163 */                     if (ie6) {
/* 164 */                         $('html,body').css('height','100%');
/* 165 */                         $iframe.css('height', '100%');
/* 166 */                     } // ie6 hack for height: 100%; TODO: handle this in IE7
/* 167 */                 }
/* 168 */             }
/* 169 */ 
/* 170 */ 
/* 171 */             /* Set the position of the modal'd window ($self)
/* 172 *|                     : if $self is taller than the window, then make it absolutely positioned
/* 173 *|                     : otherwise fixed
/* 174 *|             */
/* 175 */             function setSelfPosition() {
/* 176 */                 var s = $self[0].style;
/* 177 */ 
/* 178 */                 // reset CSS so width is re-calculated for margin-left CSS
/* 179 */                 $self.css({left: '50%', marginLeft: ($self.outerWidth() / 2) * -1,  zIndex: (opts.zIndex + 3) });
/* 180 */ 
/* 181 */ 
/* 182 */                 /* we have to get a little fancy when dealing with height, because lightbox_me
/* 183 *|                     is just so fancy.
/* 184 *|                  */
/* 185 */ 
/* 186 */                 // if the height of $self is bigger than the window and self isn't already position absolute
/* 187 */                 if (($self.height() + 80  >= $(window).height()) && ($self.css('position') != 'absolute' || ie6)) {
/* 188 */ 
/* 189 */                     // we are going to make it positioned where the user can see it, but they can still scroll
/* 190 */                     // so the top offset is based on the user's scroll position.
/* 191 */                     var topOffset = $(document).scrollTop() + 40;
/* 192 */                     $self.css({position: 'absolute', top: topOffset + 'px', marginTop: 0})
/* 193 */                     if (ie6) {
/* 194 */                         s.removeExpression('top');
/* 195 */                     }
/* 196 */                 } else if ($self.height()+ 80  < $(window).height()) {
/* 197 */                     //if the height is less than the window height, then we're gonna make this thing position: fixed.
/* 198 */                     // in ie6 we're gonna fake it.
/* 199 */                     if (ie6) {
/* 200 */                         s.position = 'absolute';

/* jquery.lightbox_me.js */

/* 201 */                         if (opts.centered) {
/* 202 */                             s.setExpression('top', '(document.documentElement.clientHeight || document.body.clientHeight) / 2 - (this.offsetHeight / 2) + (blah = document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop) + "px"')
/* 203 */                             s.marginTop = 0;
/* 204 */                         } else {
/* 205 */                             var top = (opts.modalCSS && opts.modalCSS.top) ? parseInt(opts.modalCSS.top) : 0;
/* 206 */                             s.setExpression('top', '((blah = document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop) + '+top+') + "px"')
/* 207 */                         }
/* 208 */                     } else {
/* 209 */                         if (opts.centered) {
/* 210 */                             $self.css({ position: 'fixed', top: '50%', marginTop: ($self.outerHeight() / 2) * -1})
/* 211 */                         } else {
/* 212 */                             $self.css({ position: 'fixed'}).css(opts.modalCSS);
/* 213 */                         }
/* 214 */ 
/* 215 */                     }
/* 216 */                 }
/* 217 */             }
/* 218 */ 
/* 219 */         });
/* 220 */ 
/* 221 */ 
/* 222 */ 
/* 223 */     };
/* 224 */ 
/* 225 */     $.fn.lightbox_me.defaults = {
/* 226 */ 
/* 227 */         // animation
/* 228 */         appearEffect: "fadeIn",
/* 229 */         appearEase: "",
/* 230 */         overlaySpeed: 250,
/* 231 */         lightboxSpeed: 300,
/* 232 */ 
/* 233 */         // close
/* 234 */         closeSelector: ".close",
/* 235 */         closeClick: true,
/* 236 */         closeEsc: true,
/* 237 */ 
/* 238 */         // behavior
/* 239 */         destroyOnClose: false,
/* 240 */         showOverlay: true,
/* 241 */         parentLightbox: false,
/* 242 */ 
/* 243 */         // callbacks
/* 244 */         onLoad: function() {},
/* 245 */         onClose: function() {},
/* 246 */ 
/* 247 */         // style
/* 248 */         classPrefix: 'lb',
/* 249 */         zIndex: 999,
/* 250 */         centered: false,

/* jquery.lightbox_me.js */

/* 251 */         modalCSS: {top: '40px'},
/* 252 */         overlayCSS: {background: 'black', opacity: .3}
/* 253 */     }
/* 254 */ })(jQuery);

;
/* jquery.easing.1.3.js */

/* 1   */ /*
/* 2   *|  * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
/* 3   *|  *
/* 4   *|  * Uses the built in easing capabilities added In jQuery 1.1
/* 5   *|  * to offer multiple easing options
/* 6   *|  *
/* 7   *|  * TERMS OF USE - jQuery Easing
/* 8   *|  * 
/* 9   *|  * Open source under the BSD License. 
/* 10  *|  * 
/* 11  *|  * Copyright © 2008 George McGinley Smith
/* 12  *|  * All rights reserved.
/* 13  *|  * 
/* 14  *|  * Redistribution and use in source and binary forms, with or without modification, 
/* 15  *|  * are permitted provided that the following conditions are met:
/* 16  *|  * 
/* 17  *|  * Redistributions of source code must retain the above copyright notice, this list of 
/* 18  *|  * conditions and the following disclaimer.
/* 19  *|  * Redistributions in binary form must reproduce the above copyright notice, this list 
/* 20  *|  * of conditions and the following disclaimer in the documentation and/or other materials 
/* 21  *|  * provided with the distribution.
/* 22  *|  * 
/* 23  *|  * Neither the name of the author nor the names of contributors may be used to endorse 
/* 24  *|  * or promote products derived from this software without specific prior written permission.
/* 25  *|  * 
/* 26  *|  * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
/* 27  *|  * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
/* 28  *|  * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
/* 29  *|  *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
/* 30  *|  *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
/* 31  *|  *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
/* 32  *|  * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
/* 33  *|  *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
/* 34  *|  * OF THE POSSIBILITY OF SUCH DAMAGE. 
/* 35  *|  *
/* 36  *| */
/* 37  */ 
/* 38  */ // t: current time, b: begInnIng value, c: change In value, d: duration
/* 39  */ jQuery.easing['jswing'] = jQuery.easing['swing'];
/* 40  */ 
/* 41  */ jQuery.extend( jQuery.easing,
/* 42  */ {
/* 43  */ 	def: 'easeOutQuad',
/* 44  */ 	swing: function (x, t, b, c, d) {
/* 45  */ 		//alert(jQuery.easing.default);
/* 46  */ 		return jQuery.easing[jQuery.easing.def](x, t, b, c, d);
/* 47  */ 	},
/* 48  */ 	easeInQuad: function (x, t, b, c, d) {
/* 49  */ 		return c*(t/=d)*t + b;
/* 50  */ 	},

/* jquery.easing.1.3.js */

/* 51  */ 	easeOutQuad: function (x, t, b, c, d) {
/* 52  */ 		return -c *(t/=d)*(t-2) + b;
/* 53  */ 	},
/* 54  */ 	easeInOutQuad: function (x, t, b, c, d) {
/* 55  */ 		if ((t/=d/2) < 1) return c/2*t*t + b;
/* 56  */ 		return -c/2 * ((--t)*(t-2) - 1) + b;
/* 57  */ 	},
/* 58  */ 	easeInCubic: function (x, t, b, c, d) {
/* 59  */ 		return c*(t/=d)*t*t + b;
/* 60  */ 	},
/* 61  */ 	easeOutCubic: function (x, t, b, c, d) {
/* 62  */ 		return c*((t=t/d-1)*t*t + 1) + b;
/* 63  */ 	},
/* 64  */ 	easeInOutCubic: function (x, t, b, c, d) {
/* 65  */ 		if ((t/=d/2) < 1) return c/2*t*t*t + b;
/* 66  */ 		return c/2*((t-=2)*t*t + 2) + b;
/* 67  */ 	},
/* 68  */ 	easeInQuart: function (x, t, b, c, d) {
/* 69  */ 		return c*(t/=d)*t*t*t + b;
/* 70  */ 	},
/* 71  */ 	easeOutQuart: function (x, t, b, c, d) {
/* 72  */ 		return -c * ((t=t/d-1)*t*t*t - 1) + b;
/* 73  */ 	},
/* 74  */ 	easeInOutQuart: function (x, t, b, c, d) {
/* 75  */ 		if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
/* 76  */ 		return -c/2 * ((t-=2)*t*t*t - 2) + b;
/* 77  */ 	},
/* 78  */ 	easeInQuint: function (x, t, b, c, d) {
/* 79  */ 		return c*(t/=d)*t*t*t*t + b;
/* 80  */ 	},
/* 81  */ 	easeOutQuint: function (x, t, b, c, d) {
/* 82  */ 		return c*((t=t/d-1)*t*t*t*t + 1) + b;
/* 83  */ 	},
/* 84  */ 	easeInOutQuint: function (x, t, b, c, d) {
/* 85  */ 		if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
/* 86  */ 		return c/2*((t-=2)*t*t*t*t + 2) + b;
/* 87  */ 	},
/* 88  */ 	easeInSine: function (x, t, b, c, d) {
/* 89  */ 		return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
/* 90  */ 	},
/* 91  */ 	easeOutSine: function (x, t, b, c, d) {
/* 92  */ 		return c * Math.sin(t/d * (Math.PI/2)) + b;
/* 93  */ 	},
/* 94  */ 	easeInOutSine: function (x, t, b, c, d) {
/* 95  */ 		return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
/* 96  */ 	},
/* 97  */ 	easeInExpo: function (x, t, b, c, d) {
/* 98  */ 		return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
/* 99  */ 	},
/* 100 */ 	easeOutExpo: function (x, t, b, c, d) {

/* jquery.easing.1.3.js */

/* 101 */ 		return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
/* 102 */ 	},
/* 103 */ 	easeInOutExpo: function (x, t, b, c, d) {
/* 104 */ 		if (t==0) return b;
/* 105 */ 		if (t==d) return b+c;
/* 106 */ 		if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
/* 107 */ 		return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
/* 108 */ 	},
/* 109 */ 	easeInCirc: function (x, t, b, c, d) {
/* 110 */ 		return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
/* 111 */ 	},
/* 112 */ 	easeOutCirc: function (x, t, b, c, d) {
/* 113 */ 		return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
/* 114 */ 	},
/* 115 */ 	easeInOutCirc: function (x, t, b, c, d) {
/* 116 */ 		if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
/* 117 */ 		return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
/* 118 */ 	},
/* 119 */ 	easeInElastic: function (x, t, b, c, d) {
/* 120 */ 		var s=1.70158;var p=0;var a=c;
/* 121 */ 		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
/* 122 */ 		if (a < Math.abs(c)) { a=c; var s=p/4; }
/* 123 */ 		else var s = p/(2*Math.PI) * Math.asin (c/a);
/* 124 */ 		return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
/* 125 */ 	},
/* 126 */ 	easeOutElastic: function (x, t, b, c, d) {
/* 127 */ 		var s=1.70158;var p=0;var a=c;
/* 128 */ 		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
/* 129 */ 		if (a < Math.abs(c)) { a=c; var s=p/4; }
/* 130 */ 		else var s = p/(2*Math.PI) * Math.asin (c/a);
/* 131 */ 		return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
/* 132 */ 	},
/* 133 */ 	easeInOutElastic: function (x, t, b, c, d) {
/* 134 */ 		var s=1.70158;var p=0;var a=c;
/* 135 */ 		if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
/* 136 */ 		if (a < Math.abs(c)) { a=c; var s=p/4; }
/* 137 */ 		else var s = p/(2*Math.PI) * Math.asin (c/a);
/* 138 */ 		if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
/* 139 */ 		return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
/* 140 */ 	},
/* 141 */ 	easeInBack: function (x, t, b, c, d, s) {
/* 142 */ 		if (s == undefined) s = 1.70158;
/* 143 */ 		return c*(t/=d)*t*((s+1)*t - s) + b;
/* 144 */ 	},
/* 145 */ 	easeOutBack: function (x, t, b, c, d, s) {
/* 146 */ 		if (s == undefined) s = 1.70158;
/* 147 */ 		return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
/* 148 */ 	},
/* 149 */ 	easeInOutBack: function (x, t, b, c, d, s) {
/* 150 */ 		if (s == undefined) s = 1.70158; 

/* jquery.easing.1.3.js */

/* 151 */ 		if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
/* 152 */ 		return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
/* 153 */ 	},
/* 154 */ 	easeInBounce: function (x, t, b, c, d) {
/* 155 */ 		return c - jQuery.easing.easeOutBounce (x, d-t, 0, c, d) + b;
/* 156 */ 	},
/* 157 */ 	easeOutBounce: function (x, t, b, c, d) {
/* 158 */ 		if ((t/=d) < (1/2.75)) {
/* 159 */ 			return c*(7.5625*t*t) + b;
/* 160 */ 		} else if (t < (2/2.75)) {
/* 161 */ 			return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
/* 162 */ 		} else if (t < (2.5/2.75)) {
/* 163 */ 			return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
/* 164 */ 		} else {
/* 165 */ 			return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
/* 166 */ 		}
/* 167 */ 	},
/* 168 */ 	easeInOutBounce: function (x, t, b, c, d) {
/* 169 */ 		if (t < d/2) return jQuery.easing.easeInBounce (x, t*2, 0, c, d) * .5 + b;
/* 170 */ 		return jQuery.easing.easeOutBounce (x, t*2-d, 0, c, d) * .5 + c*.5 + b;
/* 171 */ 	}
/* 172 */ });
/* 173 */ 
/* 174 */ /*
/* 175 *|  *
/* 176 *|  * TERMS OF USE - EASING EQUATIONS
/* 177 *|  * 
/* 178 *|  * Open source under the BSD License. 
/* 179 *|  * 
/* 180 *|  * Copyright © 2001 Robert Penner
/* 181 *|  * All rights reserved.
/* 182 *|  * 
/* 183 *|  * Redistribution and use in source and binary forms, with or without modification, 
/* 184 *|  * are permitted provided that the following conditions are met:
/* 185 *|  * 
/* 186 *|  * Redistributions of source code must retain the above copyright notice, this list of 
/* 187 *|  * conditions and the following disclaimer.
/* 188 *|  * Redistributions in binary form must reproduce the above copyright notice, this list 
/* 189 *|  * of conditions and the following disclaimer in the documentation and/or other materials 
/* 190 *|  * provided with the distribution.
/* 191 *|  * 
/* 192 *|  * Neither the name of the author nor the names of contributors may be used to endorse 
/* 193 *|  * or promote products derived from this software without specific prior written permission.
/* 194 *|  * 
/* 195 *|  * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
/* 196 *|  * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
/* 197 *|  * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
/* 198 *|  *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
/* 199 *|  *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
/* 200 *|  *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 

/* jquery.easing.1.3.js */

/* 201 *|  * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
/* 202 *|  *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
/* 203 *|  * OF THE POSSIBILITY OF SUCH DAMAGE. 
/* 204 *|  *
/* 205 *|  */

;
/* jquery-timing.min.js */

/* 1   */ /**
/* 2   *| 
/* 3   *|  * timing.jquery.js
/* 4   *|  *
/* 5   *|  * JavaScript functions for waiting / repeating / stopping jQuery actions.
/* 6   *|  *
/* 7   *|  * This code is published under the MIT License (MIT).
/* 8   *|  * http://www.opensource.org/licenses/mit-license.php
/* 9   *|  *
/* 10  *|  * For examples, reference, and other information see
/* 11  *|  * http://creativecouple.github.com/jquery-timing/
/* 12  *|  *
/* 13  *|  * @author CreativeCouple
/* 14  *|  * @author Peter Liske
/* 15  *|  * @copyright (c) 2011 by CreativeCouple
/* 16  *|  * @see http://creativecouple.github.com/jquery-timing/
/* 17  *|  */
/* 18  */ 
/* 19  */ (function(jQuery, window){
/* 20  */ 	/**
/* 21  *| 	 * object to store statically invoked threads
/* 22  *| 	 */
/* 23  */ 	var THREAD_GROUPS = {},
/* 24  */ 
/* 25  */ 	/**
/* 26  *| 	 * unique timing identifier for different purposes
/* 27  *| 	 */
/* 28  */ 	tuid = 1,
/* 29  */ 
/* 30  */ 	/**
/* 31  *| 	 * remember original core function $.each()
/* 32  *| 	 */
/* 33  */ 	originalEach = jQuery.fn.each,
/* 34  */ 
/* 35  */ 	/**
/* 36  *| 	 * remember original core function $.on() (or $.bind())
/* 37  *| 	 */
/* 38  */ 	originalOn = jQuery.fn.on || jQuery.fn.bind,
/* 39  */ 
/* 40  */ 	/**
/* 41  *| 	 * remember original core function $.off() (or $.unbind())
/* 42  *| 	 */
/* 43  */ 	originalOff = jQuery.fn.off || jQuery.fn.unbind,
/* 44  */ 
/* 45  */ 	/**
/* 46  *| 	 * .until() and .all() have special meanings
/* 47  *| 	 */
/* 48  */ 	loopEndMethods = {};
/* 49  */ 
/* 50  */ 	function sameOrNextJQuery(before, after) {

/* jquery-timing.min.js */

/* 51  */ 		after = jQuery(after);
/* 52  */ 		after.prevObject = before;
/* 53  */ 		var i = before.length;
/* 54  */ 		if (i !== after.length) {
/* 55  */ 			return after;
/* 56  */ 		}
/* 57  */ 		while (i--) {
/* 58  */ 			if (before[i] !== after[i]) {
/* 59  */ 				return after;
/* 60  */ 			}
/* 61  */ 		}
/* 62  */ 		return before;
/* 63  */ 	}
/* 64  */ 
/* 65  */ 	function loopCounts(loops) {
/* 66  */ 		var ret = [], i = loops.length;
/* 67  */ 		while (i--) {
/* 68  */ 			ret[i] = loops[i]._count;
/* 69  */ 		}
/* 70  */ 		return ret;
/* 71  */ 	}
/* 72  */ 
/* 73  */ 	/**
/* 74  *| 	 * Initialize a new timed invocation chain.
/* 75  *| 	 *
/* 76  *| 	 * @author CreativeCouple
/* 77  *| 	 * @author Peter Liske
/* 78  *| 	 *
/* 79  *| 	 * @param context initial context
/* 80  *| 	 * @param methodStack linked list of methods that has been or will be filled by someone else
/* 81  *| 	 * @param ongoingLoops optional arguments for callback parameters
/* 82  *| 	 * @param onStepCallback function to call on each step
/* 83  *| 	 * @returns the timed invocation chain method
/* 84  *| 	 */
/* 85  */ 	function createTimedInvocationChain(context, methodStack, ongoingLoops, onStepCallback) {
/* 86  */ 		ongoingLoops = ongoingLoops || [];
/* 87  */ 		var executionState = {
/* 88  */ 				_context: context,
/* 89  */ 				_method: methodStack
/* 90  */ 		},
/* 91  */ 		preventRecursion = false,
/* 92  */ 		method, otherExecutionState, deferred;
/* 93  */ 
/* 94  */ 		function hookupToProxy(state, mockup){
/* 95  */ 			state._canContinue = false;
/* 96  */ 			function fire(){
/* 97  */ 				state._next = sameOrNextJQuery(state._context, state._next);
/* 98  */ 				state._canContinue = true;
/* 99  */ 				timedInvocationChain();
/* 100 */ 			}

/* jquery-timing.min.js */

/* 101 */ 			return typeof mockup.promise == "function" ? mockup.promise().then(fire) : mockup.then(fire, true);
/* 102 */ 		}
/* 103 */ 
/* 104 */ 		/**
/* 105 *| 		 * Invoke all the methods currently in the timed invocation chain.
/* 106 *| 		 *
/* 107 *| 		 * @author CreativeCouple
/* 108 *| 		 * @author Peter Liske
/* 109 *| 		 */
/* 110 */ 		function timedInvocationChain(deferredReturnValue) {
/* 111 */ 			while (!preventRecursion) try {
/* 112 */ 				// keep recursive calls away
/* 113 */ 				preventRecursion = !preventRecursion;
/* 114 */ 				// save current context state
/* 115 */ 				if (typeof onStepCallback == "function") {
/* 116 */ 					onStepCallback(jQuery.makeArray(executionState._next || executionState._context));
/* 117 */ 				}
/* 118 */ 				// leave the chain when waiting for a trigger
/* 119 */ 				if (executionState._canContinue == false) {
/* 120 */ 					break;
/* 121 */ 				}
/* 122 */ 				// check end of chain
/* 123 */ 				if (!executionState._method._name) {
/* 124 */ 					if (deferred && (!ongoingLoops.length || ongoingLoops[0]._allowPromise)) {
/* 125 */ 						// resolve any waiting promise
/* 126 */ 						if (executionState._context && typeof executionState._context.promise == "function") {
/* 127 */ 							executionState._context.promise().then(deferred.resolve);
/* 128 */ 						} else {
/* 129 */ 							deferred.resolveWith(executionState._context);
/* 130 */ 						}
/* 131 */ 						deferred = null;
/* 132 */ 					}
/* 133 */ 					if (!ongoingLoops.length) {
/* 134 */ 						/*
/* 135 *| 						 * We've reached the end of our TIC
/* 136 *| 						 * and there is nothing left to wait for.
/* 137 *| 						 * So we can safely return the original jQuery object
/* 138 *| 						 * hence enabling instant invocation.
/* 139 *| 						 */
/* 140 */ 						return executionState._context;
/* 141 */ 					}
/* 142 */ 					/*
/* 143 *| 					 * Now we have ongoing loops but reached the chain's end.
/* 144 *| 					 */
/* 145 */ 					otherExecutionState = ongoingLoops[0]._openEndAction && ongoingLoops[0]._openEndAction(timedInvocationChain, executionState, ongoingLoops);
/* 146 */ 					if (!otherExecutionState) {
/* 147 */ 						// if innermost loop can't help us, just leave the chain
/* 148 */ 						break;
/* 149 */ 					}
/* 150 */ 					executionState = otherExecutionState;

/* jquery-timing.min.js */

/* 151 */ 					continue;
/* 152 */ 				}
/* 153 */ 				// check if user tries to use a non-existing function call
/* 154 */ 				method = executionState._context && executionState._context[executionState._method._name] || loopEndMethods[executionState._method._name];
/* 155 */ 				if (!method) {
/* 156 */ 					throw 'no such method "'+executionState._method._name+'" on object ('+executionState._context+')';
/* 157 */ 				}
/* 158 */ 				// check whether we came here triggered or not
/* 159 */ 				if (method.timing && !executionState._canContinue) {
/* 160 */ 					// prevent automatic re-trigger in case of loops
/* 161 */ 					executionState._canContinue = false;
/* 162 */ 					// handle timing method
/* 163 */ 					executionState = method.timing(timedInvocationChain, executionState, ongoingLoops, onStepCallback) || executionState;
/* 164 */ 				} else {
/* 165 */ 					if (!method.timing && !executionState._canContinue) {
/* 166 */ 						// prevent automatic re-trigger in case of loops
/* 167 */ 						executionState._next = executionState._context[executionState._method._name].apply(executionState._context, executionState._method._arguments);
/* 168 */ 						if (ongoingLoops.length && executionState._next && executionState._next instanceof PredictingProxy) {
/* 169 */ 							hookupToProxy(executionState, executionState._next);
/* 170 */ 							continue;
/* 171 */ 						}
/* 172 */ 					}
/* 173 */ 					// go to next step
/* 174 */ 					otherExecutionState = {
/* 175 */ 							_context: executionState._next,
/* 176 */ 							_method: executionState._method._next
/* 177 */ 					};
/* 178 */ 					// prevent automatic re-trigger in case of loops
/* 179 */ 					executionState._canContinue = false;
/* 180 */ 					// invoke callback method with given arguments
/* 181 */ 					if (typeof executionState._callback == "function") {
/* 182 */ 						executionState._callback.apply(executionState._context, loopCounts(ongoingLoops));
/* 183 */ 					}
/* 184 */ 					executionState = otherExecutionState;
/* 185 */ 				}
/* 186 */ 			} catch(e) {
/* 187 */ 				/*
/* 188 *| 				 * We had a runtime exception.
/* 189 *| 				 * In plain JavaScript live the chain would break now.
/* 190 *| 				 * So we do, too.
/* 191 *| 				 */
/* 192 */ 				preventRecursion = !preventRecursion;
/* 193 */ 				throw e;
/* 194 */ 			} finally {
/* 195 */ 				preventRecursion = !preventRecursion;
/* 196 */ 			}
/* 197 */ 			return deferredReturnValue;
/* 198 */ 		};
/* 199 */ 		if (jQuery.Deferred) {
/* 200 */ 			// add .promise() method to tic

/* jquery-timing.min.js */

/* 201 */ 			timedInvocationChain.promise = function(type, target){
/* 202 */ 				var ret = (deferred = deferred || jQuery.Deferred()).promise(target);
/* 203 */ 				timedInvocationChain();
/* 204 */ 				return ret;
/* 205 */ 			};
/* 206 */ 		}
/* 207 */ 		return timedInvocationChain;
/* 208 */ 	}
/* 209 */ 
/* 210 */ 	/**
/* 211 *| 	 * Create a placeholder object to collect chained method calls.
/* 212 *| 	 *
/* 213 *| 	 * @author CreativeCouple
/* 214 *| 	 * @author Peter Liske
/* 215 *| 	 *
/* 216 *| 	 * @param context initial context
/* 217 *| 	 * @param methodStack a linked list that this placeholder will fill with call parameters
/* 218 *| 	 * @return the placeholder object
/* 219 *| 	 */
/* 220 */ 	function PredictingProxy(context, methodStack, onStepCallback) {
/* 221 */ 		this['.methods'] = methodStack;
/* 222 */ 		this['.callback'] = onStepCallback;
/* 223 */ 		this.length = 0;
/* 224 */ 		Array.prototype.push.apply(this, jQuery.makeArray(this._ = context._ = context));
/* 225 */ 
/* 226 */ 		for (var key in context) {
/* 227 */ 			if (!(key in PredictingProxy.prototype) && typeof context[key] == "function") {
/* 228 */ 				this[key] = extendMockupPrototype(key);
/* 229 */ 			}
/* 230 */ 		}
/* 231 */ 	}
/* 232 */ 
/* 233 */ 	// enabling jQuery.when(tic);
/* 234 */ 	if (jQuery.Deferred) {
/* 235 */ 		PredictingProxy.prototype.promise = function(type, target) {
/* 236 */ 			if (typeof type == "object") {
/* 237 */ 				target = type;
/* 238 */ 				type = null;
/* 239 */ 			}
/* 240 */ 			return (this['.callback'] && typeof this['.callback'].promise == "function") ? this['.callback'].promise(type, target) : jQuery.Deferred().resolveWith(this).promise(target);
/* 241 */ 		};
/* 242 */ 	}
/* 243 */ 
/* 244 */ 	/**
/* 245 *| 	 * Create and return a new placeholder function on the prototype of PredictingProxy.
/* 246 *| 	 */
/* 247 */ 	function extendMockupPrototype(name){
/* 248 */ 		return PredictingProxy.prototype[name] = function(){
/* 249 */ 			this['.methods']._name = name;
/* 250 */ 			this['.methods']._arguments = arguments;

/* jquery-timing.min.js */

/* 251 */ 			this['.methods'] = this['.methods']._next = {};
/* 252 */ 			return this['.callback'] ? this['.callback'](this, name, arguments) : this;
/* 253 */ 		};
/* 254 */ 	}
/* 255 */ 
/* 256 */ 
/* 257 */ 	/**
/* 258 *| 	 * Create replacement methods for .bind(), .on(), .one(), .live(), and .delegate()
/* 259 *| 	 * that support chaining instead of giving a callback function.
/* 260 *| 	 */
/* 261 */ 	jQuery.each(['bind','on','one','live','delegate'], function(index, name){
/* 262 */ 		if (jQuery.fn[name]) {
/* 263 */ 			var original = jQuery.fn[name];
/* 264 */ 			jQuery.fn[name] = function(){
/* 265 */ 				var i, methodStack, placeholder, timedInvocationChain, deferred, context = this;
/* 266 */ 				for(i=0; i<arguments.length; i++) {
/* 267 */ 					if (typeof arguments[i] == "function" || (arguments[i] && typeof arguments[i] == "object") || arguments[i] === false) {
/* 268 */ 						if (arguments[i] !== jQuery) {
/* 269 */ 							// fix for jQuery 1.6 .one() + .unbind()
/* 270 */ 							if (typeof arguments[i] == "function" && jQuery.guid) {
/* 271 */ 								arguments[i].guid = arguments[i].guid || jQuery.guid++;
/* 272 */ 							}
/* 273 */ 							return original.apply(context, arguments);
/* 274 */ 						}
/* 275 */ 						break;
/* 276 */ 					}
/* 277 */ 				}
/* 278 */ 				Array.prototype.splice.call(arguments, i, 1, function(){
/* 279 */ 					timedInvocationChain = createTimedInvocationChain(context.$(this), methodStack, [{
/* 280 */ 							_count: jQuery.extend(Array.prototype.shift.apply(arguments), arguments),
/* 281 */ 							_allowPromise: true
/* 282 */ 						}], function(elements){
/* 283 */ 						placeholder.length = 0;
/* 284 */ 						Array.prototype.push.apply(placeholder, elements);
/* 285 */ 					});
/* 286 */ 					if (deferred) {
/* 287 */ 						timedInvocationChain.promise().then(deferred.resolve);
/* 288 */ 						deferred = null;
/* 289 */ 					}
/* 290 */ 					return timedInvocationChain();
/* 291 */ 				});
/* 292 */ 				function fire(){
/* 293 */ 					return timedInvocationChain ? timedInvocationChain(placeholder) : placeholder;
/* 294 */ 				}
/* 295 */ 				if (jQuery.Deferred) {
/* 296 */ 					fire.promise = function(type, target){
/* 297 */ 						if (typeof type == "object") {
/* 298 */ 							target = type;
/* 299 */ 							type = null;
/* 300 */ 						}

/* jquery-timing.min.js */

/* 301 */ 						return (timedInvocationChain && !type) ? timedInvocationChain.promise(type, target) : (deferred = deferred || jQuery.Deferred()).promise(target);
/* 302 */ 					};
/* 303 */ 				}
/* 304 */ 				return placeholder = new PredictingProxy(original.apply(context, arguments), methodStack = {}, fire);
/* 305 */ 			};
/* 306 */ 		}
/* 307 */ 	});
/* 308 */ 
/* 309 */ 	/**
/* 310 *| 	 * Create replacement method for .animate() and .load()
/* 311 *| 	 * that support chaining if $ is given as callback function.
/* 312 *| 	 */
/* 313 */ 	jQuery.each(['animate','load'], function(index, name){
/* 314 */ 		if (jQuery.fn[name]) {
/* 315 */ 			var original = jQuery.fn[name];
/* 316 */ 			jQuery.fn[name] = function(){
/* 317 */ 				while (arguments.length && arguments[arguments.length-1] == null) {
/* 318 */ 					Array.prototype.pop.apply(arguments);
/* 319 */ 				}
/* 320 */ 				if (this.length && arguments.length > 1 && arguments[arguments.length-1] === jQuery) {
/* 321 */ 					var event = '_timing'+tuid++;
/* 322 */ 					arguments[arguments.length-1] = function(){
/* 323 */ 						jQuery(this).trigger(event);
/* 324 */ 					};
/* 325 */ 					return this.each().one(event).all(original.apply(this, arguments));
/* 326 */ 				}
/* 327 */ 				return original.apply(this, arguments);
/* 328 */ 			};
/* 329 */ 		}
/* 330 */ 	});
/* 331 */ 
/* 332 */ 	/**
/* 333 *| 	 * Define new methods .wait(), .repeat(), .join(), .then()
/* 334 *| 	 * which will always start a new TIC if invoked outside of a TIC.
/* 335 *| 	 */
/* 336 */ 	jQuery.each(['wait','repeat','join','then'], function(index, name){
/* 337 */ 		jQuery.fn[name] = function(){
/* 338 */ 			var methodStack = {},
/* 339 */ 			placeholder = new PredictingProxy(this, methodStack, createTimedInvocationChain(this, methodStack, [], function(elements){
/* 340 */ 					placeholder.length = 0;
/* 341 */ 					Array.prototype.push.apply(placeholder, elements);
/* 342 */ 				}));
/* 343 */ 			return placeholder[name].apply(placeholder, arguments);
/* 344 */ 		};
/* 345 */ 	});
/* 346 */ 
/* 347 */ 	/**
/* 348 *| 	 * Define to wait for joining all animation queues.
/* 349 *| 	 *
/* 350 *| 	 * @param timedInvocationChain

/* jquery-timing.min.js */

/* 351 *| 	 * @param executionState
/* 352 *| 	 */
/* 353 */ 	jQuery.fn.join.timing = function(timedInvocationChain, executionState) {
/* 354 */ 		var queueName,
/* 355 */ 		promising,
/* 356 */ 		waitingElements = executionState._context.length;
/* 357 */ 
/* 358 */ 		if (typeof executionState._method._arguments[0] == "string") {
/* 359 */ 			queueName = executionState._method._arguments[0];
/* 360 */ 			if (typeof executionState._method._arguments[1] == "function") {
/* 361 */ 				executionState._callback = executionState._method._arguments[1];
/* 362 */ 			} else {
/* 363 */ 				promising = executionState._method._arguments[1];
/* 364 */ 				executionState._callback = executionState._method._arguments[2];
/* 365 */ 			}
/* 366 */ 		} else {
/* 367 */ 			if (typeof executionState._method._arguments[0] == "function") {
/* 368 */ 				executionState._callback = executionState._method._arguments[0];
/* 369 */ 			} else {
/* 370 */ 				promising = executionState._method._arguments[0];
/* 371 */ 				executionState._callback = executionState._method._arguments[1];
/* 372 */ 			}
/* 373 */ 		}
/* 374 */ 
/* 375 */ 		executionState._next = executionState._context;
/* 376 */ 		executionState._canContinue = !waitingElements;
/* 377 */ 
/* 378 */ 		// wait for each element to reach the current end of its queue
/* 379 */ 		if (promising) {
/* 380 */ 			executionState._context.promise(queueName == null ? 'fx' : queueName).then(function(){
/* 381 */ 				executionState._canContinue = true;
/* 382 */ 				timedInvocationChain();
/* 383 */ 			});
/* 384 */ 		} else {
/* 385 */ 			executionState._context.queue(queueName == null ? 'fx' : queueName, function(next){
/* 386 */ 				executionState._canContinue = !--waitingElements;
/* 387 */ 				timedInvocationChain();
/* 388 */ 				next();
/* 389 */ 			});
/* 390 */ 		}
/* 391 */ 	};
/* 392 */ 
/* 393 */ 	/**
/* 394 *| 	 * Define to simply run callback method for .then()
/* 395 *| 	 *
/* 396 *| 	 * @param timedInvocationChain
/* 397 *| 	 * @param executionState
/* 398 *| 	 */
/* 399 */ 	jQuery.fn.then.timing = function(timedInvocationChain, executionState){
/* 400 */ 		executionState._callback = executionState._method._arguments[0];

/* jquery-timing.min.js */

/* 401 */ 		executionState._next = executionState._context;
/* 402 */ 		executionState._canContinue = true;
/* 403 */ 		if (executionState._method._arguments[1]) {
/* 404 */ 			Array.prototype.shift.apply(executionState._method._arguments);
/* 405 */ 		}
/* 406 */ 	};
/* 407 */ 
/* 408 */ 	/**
/* 409 *| 	 * Define timeout or binding to wait for.
/* 410 *| 	 *
/* 411 *| 	 * @param timedInvocationChain
/* 412 *| 	 * @param executionState
/* 413 *| 	 */
/* 414 */ 	jQuery.fn.wait.timing = function(timedInvocationChain, executionState, ongoingLoops) {
/* 415 */ 		var trigger, event, timeout, context = executionState._context;
/* 416 */ 
/* 417 */ 		trigger = executionState._method._arguments[0];
/* 418 */ 		executionState._callback = executionState._method._arguments[1];
/* 419 */ 
/* 420 */ 		function triggerAction() {
/* 421 */ 			originalOff.call(event ? originalOff.call(context, event, triggerAction) : context, 'unwait', unwaitAction);
/* 422 */ 			executionState._canContinue = true;
/* 423 */ 			executionState._next = sameOrNextJQuery(executionState._context, executionState._next);
/* 424 */ 			timedInvocationChain();
/* 425 */ 		}
/* 426 */ 
/* 427 */ 		function unwaitAction(evt, skipWait){
/* 428 */ 			originalOff.call(event ? originalOff.call(jQuery(this), event, triggerAction) : jQuery(this), 'unwait', unwaitAction);
/* 429 */ 			context = context.not(this);
/* 430 */ 			if (!skipWait) {
/* 431 */ 				executionState._next = executionState._next.not(this);
/* 432 */ 			}
/* 433 */ 			if (!context.length) {
/* 434 */ 				executionState._canContinue = executionState._next.length;
/* 435 */ 				executionState._next = sameOrNextJQuery(executionState._context, executionState._next);
/* 436 */ 				window.clearTimeout(timeout);
/* 437 */ 				executionState = { _context: context };
/* 438 */ 			}
/* 439 */ 			// just update the snapshot info
/* 440 */ 			timedInvocationChain();
/* 441 */ 		}
/* 442 */ 
/* 443 */ 		originalOn.call(context, 'unwait', unwaitAction);
/* 444 */ 		executionState._next = context;
/* 445 */ 
/* 446 */ 		if (trigger == null || trigger == jQuery) {
/* 447 */ 			trigger = context;
/* 448 */ 		}
/* 449 */ 		if (typeof trigger == "function") {
/* 450 */ 			trigger = trigger.apply(context, loopCounts(ongoingLoops));

/* jquery-timing.min.js */

/* 451 */ 		}
/* 452 */ 		if (typeof trigger == "string") {
/* 453 */ 
/* 454 */ 			originalOn.call(context, event = trigger, triggerAction);
/* 455 */ 
/* 456 */ 		} else if (trigger && typeof trigger.promise == "function") {
/* 457 */ 
/* 458 */ 			trigger.promise().then(triggerAction);
/* 459 */ 
/* 460 */ 		} else if (trigger && typeof trigger.then == "function") {
/* 461 */ 
/* 462 */ 			trigger.then(triggerAction, true);
/* 463 */ 
/* 464 */ 		} else {
/* 465 */ 
/* 466 */ 			timeout = window.setTimeout(triggerAction, Math.max(0,trigger));
/* 467 */ 
/* 468 */ 		}
/* 469 */ 	};
/* 470 */ 
/* 471 */ 	/**
/* 472 *| 	 * Define to simply run callback method for .then()
/* 473 *| 	 *
/* 474 *| 	 * @param timedInvocationChain
/* 475 *| 	 * @param executionState
/* 476 *| 	 */
/* 477 */ 	jQuery.fn.each = function(callback){
/* 478 */ 		if (!callback || callback === jQuery) {
/* 479 */ 			var methodStack = {},
/* 480 */ 			placeholder = new PredictingProxy(this, methodStack, createTimedInvocationChain(this, methodStack, [], function(elements){
/* 481 */ 					placeholder.length = 0;
/* 482 */ 					Array.prototype.push.apply(placeholder, elements);
/* 483 */ 				}));
/* 484 */ 			return placeholder.each(callback);
/* 485 */ 		}
/* 486 */ 		return originalEach.apply(this, arguments);
/* 487 */ 	};
/* 488 */ 
/* 489 */ 	/**
/* 490 *| 	 * Define interval or binding to repeat.
/* 491 *| 	 *
/* 492 *| 	 * @param timedInvocationChain
/* 493 *| 	 * @param executionState
/* 494 *| 	 */
/* 495 */ 	jQuery.fn.each.timing = function(timedInvocationChain, executionState, ongoingLoops, onStepCallback) {
/* 496 */ 		if (executionState._method._arguments[0] && executionState._method._arguments[0] !== jQuery) {
/* 497 */ 			executionState._canContinue = true;
/* 498 */ 			executionState._next = originalEach.apply(executionState._context, executionState._method._arguments);
/* 499 */ 			return;
/* 500 */ 		}

/* jquery-timing.min.js */

/* 501 */ 
/* 502 */ 		var size = Math.max(executionState._context.length, 1),
/* 503 */ 		finished = 0,
/* 504 */ 		key, methodToGoOn, openLoopTimeout,
/* 505 */ 		innerTICs = [],
/* 506 */ 		innerElements = [],
/* 507 */ 		proxyPlaceholder = jQuery.extend({}, executionState._context),
/* 508 */ 		stepByStep = executionState._method._arguments[0] === jQuery;
/* 509 */ 
/* 510 */ 		if (stepByStep) {
/* 511 */ 			window.setTimeout(function(){
/* 512 */ 				openLoopTimeout = true;
/* 513 */ 				timedInvocationChain();
/* 514 */ 			},0);
/* 515 */ 		}
/* 516 */ 
/* 517 */ 		function spreadAction(){
/* 518 */ 			if (stepByStep) {
/* 519 */ 				if (finished < size) {
/* 520 */ 					(innerTICs[finished])();
/* 521 */ 				}
/* 522 */ 			} else {
/* 523 */ 				for (var i=0; i<size; i++) {
/* 524 */ 					(innerTICs[i])();
/* 525 */ 				}
/* 526 */ 			}
/* 527 */ 			return proxyPlaceholder;
/* 528 */ 		}
/* 529 */ 
/* 530 */ 		for (key in PredictingProxy.prototype) {
/* 531 */ 			proxyPlaceholder[key] = spreadAction;
/* 532 */ 		}
/* 533 */ 		proxyPlaceholder.length = size;
/* 534 */ 		for(key=0; key<size; key++) (function(index){
/* 535 */ 			var innerLoops = ongoingLoops.slice(),
/* 536 */ 			context = executionState._context.eq(index);
/* 537 */ 			innerElements[index] = context.get();
/* 538 */ 			innerLoops.unshift({
/* 539 */ 				_count: index,
/* 540 */ 				_allAction: function(state){
/* 541 */ 					finished++;
/* 542 */ 					if (finished == size) {
/* 543 */ 						methodToGoOn = state._method._next;
/* 544 */ 					}
/* 545 */ 					timedInvocationChain();
/* 546 */ 				},
/* 547 */ 				_fixOpenLoop: loopEndMethods.all,
/* 548 */ 				_openEndAction: function(tic, state){
/* 549 */ 					if (openLoopTimeout) {
/* 550 */ 						finished++;

/* jquery-timing.min.js */

/* 551 */ 						if (finished == size) {
/* 552 */ 							methodToGoOn = state._method;
/* 553 */ 						}
/* 554 */ 						timedInvocationChain();
/* 555 */ 					}
/* 556 */ 				}
/* 557 */ 			});
/* 558 */ 			innerTICs[index] = createTimedInvocationChain(context, executionState._method._next, innerLoops, function(elements){
/* 559 */ 				innerElements[index] = elements;
/* 560 */ 				proxyPlaceholder.length = 0;
/* 561 */ 				for (var i=0; i<size; i++) {
/* 562 */ 					Array.prototype.push.apply(proxyPlaceholder, innerElements[i]);
/* 563 */ 				}
/* 564 */ 				if (onStepCallback)
/* 565 */ 					onStepCallback(jQuery.makeArray(proxyPlaceholder));
/* 566 */ 			});
/* 567 */ 		})(key);
/* 568 */ 
/* 569 */ 		executionState._next = proxyPlaceholder;
/* 570 */ 		executionState._canContinue = true;
/* 571 */ 		executionState._openEndAction = function(tic, state){
/* 572 */ 			if (finished == size) {
/* 573 */ 				ongoingLoops.shift();
/* 574 */ 				return {
/* 575 */ 					_context: sameOrNextJQuery(executionState._context, proxyPlaceholder),
/* 576 */ 					_method: methodToGoOn
/* 577 */ 				};
/* 578 */ 			}
/* 579 */ 			var finishedBefore = finished;
/* 580 */ 			spreadAction();
/* 581 */ 			if (finished != finishedBefore) {
/* 582 */ 				return state;
/* 583 */ 			}
/* 584 */ 		};
/* 585 */ 		executionState._count = size;
/* 586 */ 
/* 587 */ 		ongoingLoops.unshift(executionState);
/* 588 */ 	};
/* 589 */ 
/* 590 */ 	loopEndMethods.all = function(executionState){
/* 591 */ 		jQuery.extend(executionState._method, {
/* 592 */ 			_next: jQuery.extend({}, executionState._method),
/* 593 */ 			_name: 'all',
/* 594 */ 			_arguments: []
/* 595 */ 		});
/* 596 */ 		executionState._canContinue = null;
/* 597 */ 	};
/* 598 */ 	loopEndMethods.all.timing = function(timedInvocationChain, executionState, ongoingLoops) {
/* 599 */ 		if (!ongoingLoops.length || !ongoingLoops[0]._fixOpenLoop) {
/* 600 */ 			throw '.all() method must be used after .each() only';

/* jquery-timing.min.js */

/* 601 */ 		}
/* 602 */ 		if (!ongoingLoops[0]._allAction) {
/* 603 */ 			ongoingLoops[0]._fixOpenLoop(executionState);
/* 604 */ 			return;
/* 605 */ 		}
/* 606 */ 
/* 607 */ 		ongoingLoops[0]._allAction(executionState);
/* 608 */ 	};
/* 609 */ 
/* 610 */ 	/**
/* 611 *| 	 * Define interval or binding to repeat.
/* 612 *| 	 *
/* 613 *| 	 * @param timedInvocationChain
/* 614 *| 	 * @param executionState
/* 615 *| 	 */
/* 616 */ 	jQuery.fn.repeat.timing = function(timedInvocationChain, executionState, ongoingLoops) {
/* 617 */ 		var trigger,
/* 618 */ 		firstRunNow,
/* 619 */ 		openLoopTimeout,
/* 620 */ 		event,
/* 621 */ 		interval;
/* 622 */ 
/* 623 */ 		if (typeof executionState._method._arguments[0] == "function") {
/* 624 */ 			executionState._callback = executionState._method._arguments[0];
/* 625 */ 		} else if (typeof executionState._method._arguments[1] == "function") {
/* 626 */ 			trigger = executionState._method._arguments[0];
/* 627 */ 			executionState._callback = executionState._method._arguments[1];
/* 628 */ 		} else {
/* 629 */ 			trigger = executionState._method._arguments[0];
/* 630 */ 			firstRunNow = executionState._method._arguments[1];
/* 631 */ 			executionState._callback = executionState._method._arguments[2];
/* 632 */ 		}
/* 633 */ 
/* 634 */ 		function triggerAction() {
/* 635 */ 			executionState._next = executionState._next || executionState._context;
/* 636 */ 			executionState._canContinue = true;
/* 637 */ 			timedInvocationChain();
/* 638 */ 		}
/* 639 */ 
/* 640 */ 		function unrepeatAction(){
/* 641 */ 			originalOff.call(event ? originalOff.call(jQuery(this), event, triggerAction) : jQuery(this), 'unrepeat', unrepeatAction);
/* 642 */ 			var context = executionState._context.not(this);
/* 643 */ 			executionState._next = (executionState._next == executionState._context) ? context : executionState._next;
/* 644 */ 			executionState._context = context;
/* 645 */ 			executionState._canContinue = executionState._context.length && executionState._canContinue;
/* 646 */ 			trigger = executionState._context.length && trigger;
/* 647 */ 			window.clearInterval(!executionState._context.length && interval);
/* 648 */ 			// just update the snapshot info
/* 649 */ 			timedInvocationChain();
/* 650 */ 		}

/* jquery-timing.min.js */

/* 651 */ 
/* 652 */ 		executionState._openEndAction = function(tic, state){
/* 653 */ 			if (executionState._canContinue || openLoopTimeout) {
/* 654 */ 				executionState._count++;
/* 655 */ 				executionState._next = executionState._next || executionState._context;
/* 656 */ 				executionState._canContinue = executionState._canContinue || (trigger && state._context && state._context.length);
/* 657 */ 				return executionState;
/* 658 */ 			}
/* 659 */ 		};
/* 660 */ 
/* 661 */ 		if (trigger == null) {
/* 662 */ 
/* 663 */ 			firstRunNow = trigger = true;
/* 664 */ 			window.setTimeout(function(){
/* 665 */ 				openLoopTimeout = true;
/* 666 */ 				timedInvocationChain();
/* 667 */ 			},0);
/* 668 */ 
/* 669 */ 		} else {
/* 670 */ 			if (typeof trigger == "string") {
/* 671 */ 				originalOn.call(executionState._context, event = trigger, triggerAction);
/* 672 */ 			} else {
/* 673 */ 				interval = window.setInterval(triggerAction, Math.max(0, trigger));
/* 674 */ 			}
/* 675 */ 			trigger = false;
/* 676 */ 		}
/* 677 */ 
/* 678 */ 		originalOn.call(executionState._context, 'unrepeat', unrepeatAction);
/* 679 */ 
/* 680 */ 		executionState._next = executionState._context;
/* 681 */ 		executionState._count = 0;
/* 682 */ 		executionState._untilAction = function(end){
/* 683 */ 			if (end) {
/* 684 */ 				unrepeatAction.apply(executionState._context);
/* 685 */ 			}
/* 686 */ 			if (trigger) {
/* 687 */ 				triggerAction();
/* 688 */ 			}
/* 689 */ 		};
/* 690 */ 		executionState._fixOpenLoop = loopEndMethods.until;
/* 691 */ 
/* 692 */ 		if (firstRunNow) {
/* 693 */ 			triggerAction();
/* 694 */ 		}
/* 695 */ 
/* 696 */ 		ongoingLoops.unshift(executionState);
/* 697 */ 	};
/* 698 */ 
/* 699 */ 	/**
/* 700 *| 	 * Defined to evaluate condition when calling .until()

/* jquery-timing.min.js */

/* 701 *| 	 */
/* 702 */ 	loopEndMethods.until = function(executionState){
/* 703 */ 		jQuery.extend(executionState._method, {
/* 704 */ 			_next: jQuery.extend({}, executionState._method),
/* 705 */ 			_name: 'until',
/* 706 */ 			_arguments: []
/* 707 */ 		});
/* 708 */ 		executionState._canContinue = null;
/* 709 */ 	};
/* 710 */ 	loopEndMethods.until.timing = function(timedInvocationChain, executionState, ongoingLoops) {
/* 711 */ 		if (!ongoingLoops.length || !ongoingLoops[0]._fixOpenLoop) {
/* 712 */ 			throw '.until() method must be used after .repeat() only';
/* 713 */ 		}
/* 714 */ 		if (!ongoingLoops[0]._untilAction) {
/* 715 */ 			ongoingLoops[0]._fixOpenLoop(executionState);
/* 716 */ 			return;
/* 717 */ 		}
/* 718 */ 
/* 719 */ 		var condition = executionState._method._arguments[0],
/* 720 */ 		loopContext = executionState._method._arguments[1];
/* 721 */ 		if (condition === jQuery) {
/* 722 */ 			condition = null;
/* 723 */ 			loopContext = executionState._method._arguments.length <= 1 || loopContext;
/* 724 */ 		}
/* 725 */ 		if (typeof condition == "function") {
/* 726 */ 			condition = condition.apply(executionState._context, loopCounts(ongoingLoops));
/* 727 */ 		}
/* 728 */ 		if (condition == null) {
/* 729 */ 			condition = !executionState._context.size();
/* 730 */ 		}
/* 731 */ 		if (typeof condition == "object") {
/* 732 */ 			condition = condition.toString();
/* 733 */ 		}
/* 734 */ 		if (typeof condition == "number") {
/* 735 */ 			condition = ongoingLoops[0]._count >= condition-1;
/* 736 */ 		}
/* 737 */ 		if (condition) {
/* 738 */ 			executionState._canContinue = true;
/* 739 */ 			executionState._next = executionState._context;
/* 740 */ 			ongoingLoops.shift()._untilAction(condition);
/* 741 */ 		} else {
/* 742 */ 			if (loopContext) {
/* 743 */ 				ongoingLoops[0]._next = executionState._context;
/* 744 */ 			}
/* 745 */ 			executionState = ongoingLoops[0];
/* 746 */ 			executionState._count++;
/* 747 */ 			executionState._untilAction(condition);
/* 748 */ 			return executionState;
/* 749 */ 		}
/* 750 */ 	};

/* jquery-timing.min.js */

/* 751 */ 
/* 752 */ 	// support .until() and .all()
/* 753 */ 	new PredictingProxy(loopEndMethods);
/* 754 */ 
/* 755 */ 	/**
/* 756 *| 	 * Define unwait and unrepeat methods.
/* 757 *| 	 */
/* 758 */ 	jQuery.each(['unwait','unrepeat'], function(index, name){
/* 759 */ 		jQuery.fn[name] = function(){
/* 760 */ 			return this.trigger(name, arguments);
/* 761 */ 		};
/* 762 */ 	});
/* 763 */ 
/* 764 */ 	/**
/* 765 *| 	 * define all static timing methods:
/* 766 *| 	 *  $.wait, $.repeat ,$.join, $.then, $.unwait, $.unrepeat
/* 767 *| 	 */
/* 768 */ 	jQuery.each(['wait','repeat','join','then','unwait','unrepeat'], function(index, name){
/* 769 */ 		jQuery[name] = function(){
/* 770 */ 			var group = typeof arguments[0] == "string" ? Array.prototype.shift.apply(arguments) : '';
/* 771 */ 			return jQuery.fn[name].apply(THREAD_GROUPS[group] = (THREAD_GROUPS[group] || jQuery('<div>').text(group)), arguments);
/* 772 */ 		};
/* 773 */ 	});
/* 774 */ 
/* 775 */ 	/**
/* 776 *| 	 * X defines deferred variables that can be used in timed invocation chains
/* 777 *| 	 *
/* 778 *| 	 * @author CreativeCouple
/* 779 *| 	 * @author Peter Liske
/* 780 *| 	 */
/* 781 */ 	function X(compute, Var, calculation){
/* 782 */ 		if (typeof compute == "string") {
/* 783 */ 			calculation = new Function('x','return ['+compute+'\n,x]');
/* 784 */ 			compute = function(x, result){
/* 785 */ 				result = calculation(x);
/* 786 */ 				callbackVariable.x = result[1];
/* 787 */ 				return result[0];
/* 788 */ 			};
/* 789 */ 		}
/* 790 */ 		var hasRelatedVariable = typeof Var == "function",
/* 791 */ 		hasComputation = typeof compute == "function",
/* 792 */ 
/* 793 */ 		callbackVariable = function(value) {
/* 794 */ 			if (arguments.length == 1) {
/* 795 */ 				callbackVariable.x = value;
/* 796 */ 				if (hasRelatedVariable) {
/* 797 */ 					Var(value);
/* 798 */ 				}
/* 799 */ 			} else {
/* 800 */ 				return evaluate();

/* jquery-timing.min.js */

/* 801 */ 			}
/* 802 */ 		};
/* 803 */ 		function evaluate(value){
/* 804 */ 			value = hasRelatedVariable ? Var() : callbackVariable.x;
/* 805 */ 			return hasComputation ? compute(value) : value;
/* 806 */ 		}
/* 807 */ 
/* 808 */ 		callbackVariable.x = 0;
/* 809 */ 		callbackVariable._ = { toString: callbackVariable.$ = callbackVariable.toString = evaluate.toString = evaluate };
/* 810 */ 		callbackVariable.mod = function(val){
/* 811 */ 			return X(function(x){
/* 812 */ 				return x % val;
/* 813 */ 			}, callbackVariable);
/* 814 */ 		};
/* 815 */ 		callbackVariable.add = function(val){
/* 816 */ 			return X(function(x){
/* 817 */ 				return x + val;
/* 818 */ 			}, callbackVariable);
/* 819 */ 		};
/* 820 */ 		callbackVariable.neg = function(){
/* 821 */ 			return X('-x', callbackVariable);
/* 822 */ 		};
/* 823 */ 		// $$ only for backward compatibility
/* 824 */ 		callbackVariable.$$ = callbackVariable.X = function(compute){
/* 825 */ 			return X(compute, callbackVariable);
/* 826 */ 		};
/* 827 */ 		jQuery.each('abcdefghij', function(index, character){
/* 828 */ 			callbackVariable[index] = callbackVariable[character] = function(){
/* 829 */ 				callbackVariable(arguments[index]);
/* 830 */ 			};
/* 831 */ 		});
/* 832 */ 
/* 833 */ 		return callbackVariable;
/* 834 */ 	};
/* 835 */ 
/* 836 */ 	// $$ only for backward compatibility
/* 837 */ 	window.$$ = jQuery.$$ = jQuery.X = X;
/* 838 */ 
/* 839 */ 	/**
/* 840 *| 	 * Define chained version of $().
/* 841 *| 	 * This allows to use .end() to come back to previous jQuery selection.
/* 842 *| 	 */
/* 843 */ 	jQuery.fn.$ = function(){
/* 844 */ 		var ret = jQuery.apply(window, arguments);
/* 845 */ 		ret.prevObject = this;
/* 846 */ 		return ret;
/* 847 */ 	};
/* 848 */ 
/* 849 */ })(jQuery, window);

;
/* jquery-center.js */

/* 1  */ (function(jQuery, window){
/* 2  */ 
/* 3  */ jQuery.fn.center = function () {
/* 4  */ 	this.css("position","absolute");
/* 5  */ 	this.css("top", Math.max(0, ((jQuery(window).height() - jQuery(this).outerHeight()) / 2) +
/* 6  */ 		jQuery(window).scrollTop()) + "px");
/* 7  */ 	this.css("left", Math.max(0, ((jQuery(window).width() - jQuery(this).outerWidth()) / 2) +
/* 8  */ 		jQuery(window).scrollLeft()) + "px");
/* 9  */ 	return this;
/* 10 */ }
/* 11 */ 
/* 12 */ })(jQuery, window);

;
/* sk_wp.js */

/* 1 */ 
/* 2 */ jQuery(document).ready(function($) {
/* 3 */ 	window.sidekickWP = new SidekickWP.Models.App({
/* 4 */ 		show_toggle_feedback: true
/* 5 */ 	});
/* 6 */ 	console.log('window.sidekickWP %o', window.sidekickWP);
/* 7 */ 	// jQuery('#logo').trigger('click');
/* 8 */ });
/* 9 */ 
