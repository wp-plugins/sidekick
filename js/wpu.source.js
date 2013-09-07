
/* appModel.js */

/* 1   */ (function($) {
/* 2   */ 
/* 3   */ 	window.Wpu = {
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
/* 18  */ 
/* 19  */ 	if (window.console){
/* 20  */ 		window.console.info = function(msg,o1,o2,o3){if (!o1) o1 = '';if (!o2) o2 = '';if (!o3) o3 = '';console.log('%c' + msg,'color: blue;font-weight: bold',o1,o2,o3);};
/* 21  */ 		window.console.event = function(msg,o1,o2,o3){if (!o1) o1 = '';if (!o2) o2 = '';if (!o3) o3 = '';console.log('%c' + msg,'color: green;font-weight: bold',o1,o2,o3);};
/* 22  */ 	}
/* 23  */ 
/* 24  */ 	Wpu.Models.App = Backbone.Model.extend({
/* 25  */ 		defaults: {
/* 26  */ 			full_library:      null,
/* 27  */ 			my_library:        null,
/* 28  */ 			wp_version:        null,
/* 29  */ 			installed_plugins: null,
/* 30  */ 			current_url:       null,
/* 31  */ 			current_plugin:    null,
/* 32  */ 			license_status:    null,
/* 33  */ 			wpu_plugins:       null,
/* 34  */ 			my_plugins:        null
/* 35  */ 		},
/* 36  */ 
/* 37  */ 		initialize: function(){
/* 38  */ 			console.group('%cinitialize: App Model %o', 'color:#3b4580', this);
/* 39  */ 
/* 40  */ 			_.extend(this, Backbone.Events);
/* 41  */ 			Wpu.Events = _.extend({}, Backbone.Events);
/* 42  */ 
/* 43  */ 			// Wpu.Events.on('wpu_show_review_pane', this.show_review, this);
/* 44  */ 
/* 45  */ 			Lara.Events.on('loaded_walkthrough',this.loaded_walkthrough,this);
/* 46  */ 			Lara.Events.on('doneLastStep',this.show_review,this);
/* 47  */ 
/* 48  */ 			this.trackingModel = new Wpu.Models.Tracking();
/* 49  */ 
/* 50  */ 			if (typeof wpu_library == 'undefined') {

/* appModel.js */

/* 51  */ 				var msg = 'No Library Found!';
/* 52  */ 				Wpu.Events.trigger('track_error',{msg: msg});
/* 53  */ 
/* 54  */ 				console.error('Lara Library Not Found!');
/* 55  */ 				return;
/* 56  */ 			}
/* 57  */ 			console.info('Library -> ' + wpu_library_file);
/* 58  */ 			console.info('my wpu_library %o', wpu_library);
/* 59  */ 
/* 60  */ 
/* 61  */ 			if (typeof wpu_just_activated != 'undefined')
/* 62  */ 				Wpu.Events.trigger('wpu_activate');
/* 63  */ 
/* 64  */ 			if (typeof wpu_wp_version === 'undefined') {
/* 65  */ 				console.error('No WP Version?!?');
/* 66  */ 				return false;
/* 67  */ 			}
/* 68  */ 			console.log('wpu_wp_version %o', wpu_wp_version);
/* 69  */ 
/* 70  */ 
/* 71  */ 			if (typeof wpu_wp_version              != 'undefined') this.set('wp_version',wpu_wp_version);
/* 72  */ 			if (typeof wpu_library                 != 'undefined') this.set('full_library',wpu_library);
/* 73  */ 			if (typeof wpu_library[wpu_wp_version] != 'undefined') this.set('my_library',wpu_library[wpu_wp_version]);
/* 74  */ 			if (typeof wpu_installed_plugins       != 'undefined') this.set('installed_plugins',wpu_installed_plugins);
/* 75  */ 
/* 76  */ 			console.table(this.attributes);
/* 77  */ 
/* 78  */ 
/* 79  */ 			// console.info('Full Library %o', this.get('full_library'));
/* 80  */ 			this.set('current_url',window.location.toString());
/* 81  */ 
/* 82  */ 			this.Config = {
/* 83  */ 				domain: 'http://www.wpuniversity.com'
/* 84  */ 			};
/* 85  */ 
/* 86  */ 			this.populate_library();
/* 87  */ 			this.views = {};
/* 88  */ 			this.views.app = new Wpu.Views.App({model: this, el: $("body")});
/* 89  */ 
/* 90  */ 			var my_library = this.get('my_library');
/* 91  */ 			var my_plugins = this.get('my_plugins');
/* 92  */ 			// console.log('my_library %o', my_library);
/* 93  */ 
/* 94  */ 			console.groupEnd();
/* 95  */ 		},
/* 96  */ 
/* 97  */ 		populate_library: function(){
/* 98  */ 			if (!this.get('full_library')) {
/* 99  */ 				console.error("WPU Library Not Found!");
/* 100 */ 				return false;

/* appModel.js */

/* 101 */ 			}
/* 102 */ 			if (!this.get('wp_version')){
/* 103 */ 				console.error("No WP Version Found!");
/* 104 */ 				return false;
/* 105 */ 			}
/* 106 */ 			if (!this.get('my_library')) {
/* 107 */ 				console.error("No Walkthroughs found for this WP Version! %o",this.get('full_library'));
/* 108 */ 				return false;
/* 109 */ 			}
/* 110 */ 
/* 111 */ 			var links = this.get('full_library').links;
/* 112 */ 			if (links) {
/* 113 */ 				this.check_active_plugin(links);
/* 114 */ 			}
/* 115 */ 			this.parse_my_library();
/* 116 */ 		},
/* 117 */ 
/* 118 */ 		parse_my_library: function(){
/* 119 */ 			var my_library = this.get('my_library');
/* 120 */ 			console.log('Wpu: parse_my_library %o', my_library);
/* 121 */ 
/* 122 */ 			var my_plugins = [];
/* 123 */ 			var wpu_plugins = [];
/* 124 */ 			var installed_plugins = this.get('installed_plugins') ;
/* 125 */ 
/* 126 */ 			for (var plugin in my_library.plugins){
/* 127 */ 				var plugin_version_installed = installed_plugins[plugin];
/* 128 */ 
/* 129 */ 				if (plugin_version_installed && my_library.plugins[plugin][plugin_version_installed]) {
/* 130 */ 					console.log('Found Plugin: ' + plugin);
/* 131 */ 					var plugin_data = my_library.plugins[plugin][plugin_version_installed];
/* 132 */ 
/* 133 */ 					plugin_data.count = 0;
/* 134 */ 					plugin_data.title = plugin;
/* 135 */ 					plugin_data.id    = plugin.toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'-');
/* 136 */ 
/* 137 */ 					if (plugin_data.how) plugin_data.count       = _.size(plugin_data.how);
/* 138 */ 					if (plugin_data.overview) plugin_data.count += _.size(plugin_data.overview);
/* 139 */ 					if (plugin_data.hotspot) plugin_data.count  += _.size(plugin_data.hotspot);
/* 140 */ 
/* 141 */ 					my_plugins.push({plugin: plugin, data:plugin_data});
/* 142 */ 				} else {
/* 143 */ 					console.log('Didn\'t find Plugin: ' + plugin);
/* 144 */ 					// wpu_plugins.push(plugin);
/* 145 */ 				}
/* 146 */ 			}
/* 147 */ 
/* 148 */ 			this.set('my_plugins',my_plugins);
/* 149 */ 			this.set('wpu_plugins',wpu_plugins);
/* 150 */ 		},

/* appModel.js */

/* 151 */ 
/* 152 */ 		check_active_plugin: function(links){
/* 153 */ 			var my_library = this.get('my_library');
/* 154 */ 			var installed_plugins = this.get('installed_plugins') ;
/* 155 */ 
/* 156 */ 			loop1:
/* 157 */ 			for (var plugin in links){
/* 158 */ 				var plugin_version_installed = installed_plugins[plugin];
/* 159 */ 
/* 160 */ 				for (var url in links[plugin]){
/* 161 */ 					if (this.get('current_url').indexOf(links[plugin][url]) > -1) {
/* 162 */ 						this.set('current_plugin',plugin);
/* 163 */ 						break loop1;
/* 164 */ 					}
/* 165 */ 				}
/* 166 */ 			}
/* 167 */ 		},
/* 168 */ 
/* 169 */ 		loaded_walkthrough: function(walkthrough_model){
/* 170 */ 			console.log('WPU:loaded_walkthrough');
/* 171 */ 			this.set('last_loaded_walkthrough',walkthrough_model);
/* 172 */ 			console.log(arguments);
/* 173 */ 		},
/* 174 */ 
/* 175 */ 		show_review: function(a,b){
/* 176 */ 			console.log('show_review');
/* 177 */ 			var last_loaded_walkthrough = this.get('last_loaded_walkthrough');
/* 178 */ 			var walkthrough_title = last_loaded_walkthrough.get('title');
/* 179 */ 			console.log('walkthrough_title %o', walkthrough_title);
/* 180 */ 
/* 181 */ 			this.models.review = new Wpu.Models.Review({walkthrough_title: walkthrough_title});
/* 182 */ 		}
/* 183 */ 	});
/* 184 */ }(jQuery));

;
/* appView.js */

/* 1   */ (function($) {
/* 2   */ 	Wpu.Views.App = Backbone.View.extend({
/* 3   */ 		initialize: function(){
/* 4   */ 			console.group('%cinitialize: Wpu: App View %o', 'color:#3b4580', this);
/* 5   */ 			Wpu.Events.on('close_wpu_window', this.close_wpu_window, this);
/* 6   */ 			Wpu.Events.on('show_main_pane', this.show_main_pane, this);
/* 7   */ 			Wpu.Events.on('show_next_pane', this.show_next_pane, this);
/* 8   */ 			Wpu.Events.on('show_prev_pane', this.show_prev_pane, this);
/* 9   */ 
/* 10  */ 
/* 11  */ 
/* 12  */ 
/* 13  */ 			if (typeof Lara != 'undefined')
/* 14  */ 				Lara.Events.on('Stop', this.open_wpu_window, this);
/* 15  */ 			return this.render();
/* 16  */ 		},
/* 17  */ 
/* 18  */ 		render: function(){
/* 19  */ 			// console.info('render %o',this);
/* 20  */ 			var wpu_plugins = this.model.get('wpu_plugins');
/* 21  */ 			var my_plugins  = this.model.get('my_plugins');
/* 22  */ 			var my_library  = this.model.get('my_library');
/* 23  */ 
/* 24  */ 			if (typeof my_library === 'undefined' || !my_library) {
/* 25  */ 				var msg = 'No Library Found!';
/* 26  */ 				Wpu.Events.trigger('track_error',{msg: msg});
/* 27  */ 				console.error(msg);
/* 28  */ 				return false;
/* 29  */ 			}
/* 30  */ 
/* 31  */ 			if (!this.model.get('current_plugin')) {
/* 32  */ 				$('li.spacer:hidden').first().show();
/* 33  */ 			}
/* 34  */ 
/* 35  */ 			var core_overview_count = 0;
/* 36  */ 			var core_how_count      = 0;
/* 37  */ 			var my_plugins_count    = 0;
/* 38  */ 			var wpu_plugins_count   = 0;
/* 39  */ 
/* 40  */ 			if (my_library.core.overview) core_overview_count = _.size(my_library.core.overview);
/* 41  */ 			if (my_library.core.how) core_how_count           = _.size(my_library.core.how);
/* 42  */ 			if (my_plugins) my_plugins_count                  = _.size(my_plugins);
/* 43  */ 			if (wpu_plugins) wpu_plugins_count                = _.size(wpu_plugins);
/* 44  */ 
/* 45  */ 			var variables = {
/* 46  */ 				current_plugin:       this.model.get('current_plugin'),
/* 47  */ 				current_plugin_count: 0,
/* 48  */ 				core_count:           core_overview_count+core_how_count,
/* 49  */ 				my_plugins_count:     my_plugins_count,
/* 50  */ 				wpu_plugins_count:    wpu_plugins_count

/* appView.js */

/* 51  */ 			};
/* 52  */ 			console.log('Variables %o',variables);
/* 53  */ 
/* 54  */ 			var template = _.template( Wpu.Templates.App, variables );
/* 55  */ 			this.$el.append( template );
/* 56  */ 
/* 57  */ 			if (typeof lara !== 'undefined' && lara.get('playing')) {
/* 58  */ 				this.close_wpu_window();
/* 59  */ 			} else {
/* 60  */ 				this.open_wpu_mini_window();
/* 61  */ 			}
/* 62  */ 			console.groupEnd();
/* 63  */ 			return this;
/* 64  */ 		},
/* 65  */ 
/* 66  */ 		events: {
/* 67  */ 			"click .group_section": "clicked_section",
/* 68  */ 			"click #logo": "open_wpu_window",
/* 69  */ 			"click h2 button.close": "open_wpu_mini_window",
/* 70  */ 			"click h2 button.config": "goto_config"
/* 71  */ 		},
/* 72  */ 
/* 73  */ 		clicked_section: function(e){
/* 74  */ 			// console.log('clicked_section %o',this, arguments);
/* 75  */ 			var id = $(e.currentTarget).attr('id');
/* 76  */ 
/* 77  */ 			if (id == 'my_plugins') {
/* 78  */ 				new Wpu.Models.List({library: this.model.get('my_plugins'), id: 'my_plugins_list'});
/* 79  */ 			} else {
/* 80  */ 				var my_library = this.model.get('my_library');
/* 81  */ 				new Wpu.Models.Core({library: my_library.core, id: 'wordpress_general_list'});
/* 82  */ 			}
/* 83  */ 		},
/* 84  */ 
/* 85  */ 		close_wpu_window: function(){
/* 86  */ 			// console.log('close_wpu_window');
/* 87  */ 			$('.wpu_container').hide();
/* 88  */ 		},
/* 89  */ 
/* 90  */ 		open_wpu_mini_window: function(){
/* 91  */ 			// console.log('open_wpu_mini_window');
/* 92  */ 			var width = '100px';
/* 93  */ 			var height = '70px';
/* 94  */ 
/* 95  */ 			if ($('.wpu_container').is(':visible')) {
/* 96  */ 				$('.wpu_container>*').fadeOut('fast',function(){
/* 97  */ 					$('.wpu_container').animate({
/* 98  */ 						backgroundColor: 'transparent',
/* 99  */ 						borderColor: 'transparent'
/* 100 */ 					},200,function(){

/* appView.js */

/* 101 */ 						$('.wpu_container').removeClass('shadow');
/* 102 */ 						$('.wpu_container').animate({
/* 103 */ 							width: width,
/* 104 */ 							minHeight: height
/* 105 */ 						},200,function(){
/* 106 */ 							$('.wpu_container #logo').fadeIn('slow');
/* 107 */ 						});
/* 108 */ 					});
/* 109 */ 				});
/* 110 */ 			} else {
/* 111 */ 				$('.wpu_container').css({
/* 112 */ 					width: width,
/* 113 */ 					minHeight: height
/* 114 */ 				}).show();
/* 115 */ 			}
/* 116 */ 		},
/* 117 */ 
/* 118 */ 		goto_config: function(){
/* 119 */ 			window.open('/wp-admin/admin.php?page=wpu','_self');
/* 120 */ 		},
/* 121 */ 
/* 122 */ 		open_wpu_window: function(e){
/* 123 */ 			// console.log('open_wpu_window %o', e);
/* 124 */ 			var width = '300px';
/* 125 */ 			var height = '300px';
/* 126 */ 
/* 127 */ 			if (typeof e != 'undefined' && typeof e.currentTarget != 'undefined')
/* 128 */ 				Wpu.Events.trigger('track_open_wpu_window',{position: $(e.currentTarget).attr('id')});
/* 129 */ 
/* 130 */ 			$('.wpu_container #logo').fadeOut('fast',function(){
/* 131 */ 				$('.wpu_container').show().animate({
/* 132 */ 					backgroundColor: '#e8e8e8',
/* 133 */ 					borderColor: '#d4d4d4',
/* 134 */ 					width: width,
/* 135 */ 					height: height
/* 136 */ 				},200,function(){
/* 137 */ 					$('.wpu_container').addClass('shadow');
/* 138 */ 					$('.wpu_container>*').not('.wpu_container #logo').fadeIn('fast');
/* 139 */ 				});
/* 140 */ 			});
/* 141 */ 		},
/* 142 */ 
/* 143 */ 		show_next_pane: function(){
/* 144 */ 			console.log('show_next_pane');
/* 145 */ 			$('#wpu li.new_window, #wpu li.current_window').animate({
/* 146 */ 				left: '-=300'
/* 147 */ 			},200);
/* 148 */ 			$('#wpu .current_window').removeClass('current_window').addClass('prev_window');
/* 149 */ 			$('#wpu li.new_window').addClass('current_window').removeClass('new_window');
/* 150 */ 		},

/* appView.js */

/* 151 */ 
/* 152 */ 		show_prev_pane: function(){
/* 153 */ 			console.log('show_prev_pane');
/* 154 */ 			$('#wpu li.current_window, #wpu .prev_window').animate({
/* 155 */ 				left: '+=300'
/* 156 */ 			},200,function(a,b,c){
/* 157 */ 				if ($(this).hasClass('current_window')) {
/* 158 */ 					$('#wpu li.current_window').remove();
/* 159 */ 					$('#wpu .prev_window').removeClass('prev_window').addClass('current_window');
/* 160 */ 				}
/* 161 */ 			});
/* 162 */ 		},
/* 163 */ 
/* 164 */ 		show_main_pane: function(){
/* 165 */ 			$('#wpu li.current_window, #wpu #main_menu').animate({
/* 166 */ 				left: '+=300'
/* 167 */ 			},200,function(){
/* 168 */ 				if ($(this).hasClass('current_window')) {
/* 169 */ 					$('#wpu li.current_window').remove();
/* 170 */ 					$('#wpu #main_menu').removeClass('prev_window').addClass('current_window');
/* 171 */ 				}
/* 172 */ 			});
/* 173 */ 		}
/* 174 */ 	});
/* 175 */ 
/* 176 */ }(jQuery));
/* 177 */ 
/* 178 */ 
/* 179 */ 
/* 180 */ 

;
/* coreView.js */

/* 1  */ (function($) {
/* 2  */ 	Wpu.Views.Core = Backbone.View.extend({
/* 3  */ 
/* 4  */ 		initialize: function(models,options){
/* 5  */ 			console.group('%cinitialize: Core View %o', 'color:#3b4580', arguments);
/* 6  */ 			this.render();
/* 7  */ 			this.setup_events();
/* 8  */ 			console.groupEnd();
/* 9  */ 			return this;
/* 10 */ 		},
/* 11 */ 
/* 12 */ 		render: function(){
/* 13 */ 			// console.log('render coreView %o',this);
/* 14 */ 			var library = this.model.get('library');
/* 15 */ 
/* 16 */ 			var overview_count = 0;
/* 17 */ 			var howto_count = 0;
/* 18 */ 
/* 19 */ 			if (library.overview) overview_count = _.size(library.overview);
/* 20 */ 			if (library.how) howto_count = _.size(library.how);
/* 21 */ 
/* 22 */ 			Wpu.Events.trigger('track_explore',{what:'Core' });
/* 23 */ 
/* 24 */ 			var variables = {
/* 25 */ 				overview_count:        overview_count,
/* 26 */ 				howto_count:           howto_count,
/* 27 */ 				overview_walkthroughs: library.overview,
/* 28 */ 				howto_walkthroughs:    library.how,
/* 29 */ 				group_id:              this.model.get('id'),
/* 30 */ 				title:                 'WordPress General'
/* 31 */ 			};
/* 32 */ 			var template = _.template( Wpu.Templates.Walkthroughs, variables );
/* 33 */ 			this.$el.append( template );
/* 34 */ 			Wpu.Helpers.preventScrolling();
/* 35 */ 
/* 36 */ 			Wpu.Events.trigger('show_next_pane');
/* 37 */ 			return this;
/* 38 */ 		},
/* 39 */ 
/* 40 */ 		setup_events: function(){
/* 41 */ 			var group_id = this.model.get('id');
/* 42 */ 
/* 43 */ 			$('#' + group_id + ' h2 button').click({context:this},function(e){
/* 44 */ 				Wpu.Events.trigger('show_prev_pane');
/* 45 */ 			});
/* 46 */ 
/* 47 */ 			$('a.wpu_play_walkthrough').click(function(){
/* 48 */ 				Wpu.Events.trigger('close_wpu_window');
/* 49 */ 			}).addClass('closed');
/* 50 */ 		}

/* coreView.js */

/* 51 */ 
/* 52 */ 	});
/* 53 */ 
/* 54 */ }(jQuery));

;
/* pluginView.js */

/* 1  */ (function($) {
/* 2  */ 	Wpu.Views.Plugin = Backbone.View.extend({
/* 3  */ 
/* 4  */ 		initialize: function(models,options){
/* 5  */ 			console.group('%cinitialize: Plugin View %o', 'color:#3b4580', arguments);
/* 6  */ 			this.render();
/* 7  */ 			this.setup_events();
/* 8  */ 			console.groupEnd();
/* 9  */ 			return this;
/* 10 */ 		},
/* 11 */ 
/* 12 */ 		render: function(){
/* 13 */ 			// console.log('render pluginView %o',this);
/* 14 */ 			var library = this.model.get('library');
/* 15 */ 
/* 16 */ 			Wpu.Events.trigger('track_explore',{what:'Plugin - ' + library.title});
/* 17 */ 
/* 18 */ 			var overview_count = 0;
/* 19 */ 			var howto_count = 0;
/* 20 */ 
/* 21 */ 			if (library.overview) overview_count = _.size(library.overview);
/* 22 */ 			if (library.how) howto_count         = _.size(library.how);
/* 23 */ 
/* 24 */ 			var variables = {
/* 25 */ 				overview_count:        overview_count,
/* 26 */ 				howto_count:           howto_count,
/* 27 */ 				overview_walkthroughs: library.overview,
/* 28 */ 				howto_walkthroughs:    library.how,
/* 29 */ 				group_id:              this.model.get('id'),
/* 30 */ 				title:                 library.title
/* 31 */ 			};
/* 32 */ 
/* 33 */ 			var template = _.template( Wpu.Templates.Walkthroughs, variables );
/* 34 */ 			this.$el.append( template );
/* 35 */ 			Wpu.Helpers.preventScrolling();
/* 36 */ 			$('#wpu .walkthrough_listing#' + this.model.get('id') + ', #wpu #my_plugins_list').animate({
/* 37 */ 				left: '-=300'
/* 38 */ 			},200);
/* 39 */ 			return this;
/* 40 */ 		},
/* 41 */ 
/* 42 */ 		setup_events: function(){
/* 43 */ 			// console.log('setup_events');
/* 44 */ 			var group_id = this.model.get('id');
/* 45 */ 
/* 46 */ 			$('#' + group_id + ' h2 button').click({context:this},function(e){
/* 47 */ 				e.data.context.go_back();
/* 48 */ 			});
/* 49 */ 		},
/* 50 */ 

/* pluginView.js */

/* 51 */ 		go_back: function(){
/* 52 */ 			// console.log('pluginView: go_back %o',this);
/* 53 */ 			var id = this.model.get('id');
/* 54 */ 			// console.log('li#' + id);
/* 55 */ 			$('#wpu #my_plugins_list, #wpu li.walkthrough_listing#' + id).animate({
/* 56 */ 				left: '+=300'
/* 57 */ 			},200,function(){
/* 58 */ 				$('#wpu li.walkthrough_listing').remove();
/* 59 */ 			});
/* 60 */ 		}
/* 61 */ 	});
/* 62 */ }(jQuery));

;
/* listView.js */

/* 1  */ (function($) {
/* 2  */ 	Wpu.Views.List = Backbone.View.extend({
/* 3  */ 
/* 4  */ 		initialize: function(models,options){
/* 5  */ 			console.group('%cinitialize: List View %o', 'color:#3b4580', arguments);
/* 6  */ 			this.render();
/* 7  */ 			this.setup_events();
/* 8  */ 			console.groupEnd();
/* 9  */ 			return this;
/* 10 */ 		},
/* 11 */ 
/* 12 */ 		render: function(){
/* 13 */ 			// console.log('render pluginView %o',this);
/* 14 */ 			var library = this.model.get('library');
/* 15 */ 
/* 16 */ 			var variables = {
/* 17 */ 				plugins:  this.model.get('library'),
/* 18 */ 				group_id: this.model.get('id')
/* 19 */ 			};
/* 20 */ 
/* 21 */ 			// console.log('variables %o', variables);
/* 22 */ 
/* 23 */ 			var template = _.template( Wpu.Templates.List, variables );
/* 24 */ 			this.$el.append( template );
/* 25 */ 			Wpu.Helpers.preventScrolling();
/* 26 */ 			$('#' + this.model.get('id') + ', #wpu #main_menu').animate({
/* 27 */ 				left: '-=300'
/* 28 */ 			},200);
/* 29 */ 			return this;
/* 30 */ 		},
/* 31 */ 
/* 32 */ 		clicked_section: function(e){
/* 33 */ 			// console.log('clicked_section %o',this, arguments);
/* 34 */ 
/* 35 */ 			if ($(e.currentTarget).hasClass('spacer'))
/* 36 */ 				return false;
/* 37 */ 
/* 38 */ 			var id = $(e.currentTarget).attr('id');
/* 39 */ 			var title = $(e.currentTarget).html();
/* 40 */ 
/* 41 */ 			// Wpu.Events.trigger('track_explore',{what:'Plugin -' + title});
/* 42 */ 
/* 43 */ 			$('#wpu .plugin_listing#' + id + ', #wpu #main_menu').animate({
/* 44 */ 				left: '-=300'
/* 45 */ 			},200);
/* 46 */ 		},
/* 47 */ 
/* 48 */ 		setup_events: function(){
/* 49 */ 			// console.log('setup_events');
/* 50 */ 			var group_id = this.model.get('id');

/* listView.js */

/* 51 */ 
/* 52 */ 			$('#' + group_id + ' h2 button').click({context:this},function(e){
/* 53 */ 				e.data.context.go_back();
/* 54 */ 			});
/* 55 */ 
/* 56 */ 			$('#' + group_id + ' .plugin').click({context:this},function(e){
/* 57 */ 				e.data.context.show_walkthroughs(e);
/* 58 */ 			});
/* 59 */ 		},
/* 60 */ 
/* 61 */ 		show_walkthroughs: function(e){
/* 62 */ 			// console.log('show_walkthroughs %o', e);
/* 63 */ 
/* 64 */ 			var library = e.data.context.model.get('library');
/* 65 */ 			var clickedPlugin;
/* 66 */ 
/* 67 */ 			for (var plugin in library){
/* 68 */ 				if (library[plugin].plugin == $(e.currentTarget).data('pluginname')){
/* 69 */ 					clickedPlugin = library[plugin].data;
/* 70 */ 					break;
/* 71 */ 				}
/* 72 */ 			}
/* 73 */ 			new Wpu.Models.Plugin({library: clickedPlugin, id: 'plugin_' + clickedPlugin.id});
/* 74 */ 			$('li#my_plugins').css({left: '300px'}).animate({
/* 75 */ 				left: '-=300'
/* 76 */ 			},200);
/* 77 */ 		},
/* 78 */ 
/* 79 */ 		go_back: function(){
/* 80 */ 			var id = this.model.get('id');
/* 81 */ 			$('#wpu .plugin_listing, #wpu #main_menu').animate({
/* 82 */ 				left: '+=300'
/* 83 */ 			},200,function(){
/* 84 */ 				$('#wpu .plugin_listing').remove();
/* 85 */ 			});
/* 86 */ 		}
/* 87 */ 	});
/* 88 */ }(jQuery));

;
/* reviewView.js */

/* 1   */ (function($) {
/* 2   */ 	Wpu.Views.Review = Backbone.View.extend({
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
/* 13  */ 			console.log('render reviewView %o',this);
/* 14  */ 
/* 15  */ 			var template = _.template( Wpu.Templates.Review );
/* 16  */ 			this.$el.append( template );
/* 17  */ 			Wpu.Helpers.preventScrolling();
/* 18  */ 			Wpu.Events.trigger('show_next_pane');
/* 19  */ 
/* 20  */ 			$('#wpu .prev_window').removeClass('prev_window');
/* 21  */ 			$('#wpu #main_menu').addClass('prev_window');
/* 22  */ 			$('#wpu ul.main>li').not('#main_menu,#review').remove();
/* 23  */ 
/* 24  */ 			return this;
/* 25  */ 		},
/* 26  */ 
/* 27  */ 		events: {
/* 28  */ 			"click input[type='submit']": "submit",
/* 29  */ 			"click div.rate span": "rate"
/* 30  */ 		},
/* 31  */ 
/* 32  */ 		setup_events: function(){
/* 33  */ 			var group_id = this.model.get('id');
/* 34  */ 
/* 35  */ 			$('#wpu li#review h2 button.goback, #wpu li#review input[type="button"]').click({context:this},function(e){
/* 36  */ 				Wpu.Events.trigger('show_main_pane');
/* 37  */ 			});
/* 38  */ 
/* 39  */ 			$('#wpu li#review .rate span').hover(function(){
/* 40  */ 				$(this).addClass('hover')
/* 41  */ 				.prevAll().addClass('hover');
/* 42  */ 			},function(){
/* 43  */ 				$('#wpu li#review .rate span').removeClass('hover');
/* 44  */ 			});
/* 45  */ 
/* 46  */ 			$('#wpu li#review textarea').click(function(){
/* 47  */ 				if(!$(this).hasClass('clicked')){
/* 48  */ 					$(this).addClass('clicked')
/* 49  */ 					.val('');
/* 50  */ 				}

/* reviewView.js */

/* 51  */ 			});
/* 52  */ 		},
/* 53  */ 
/* 54  */ 		submit: function(){
/* 55  */ 			var data = {
/* 56  */ 				walkthrough_title: this.model.get('walkthrough_title'),
/* 57  */ 				value:            $('#wpu textarea[name="comment"]').val(),
/* 58  */ 				license:           wpu_license_key
/* 59  */ 			};
/* 60  */ 
/* 61  */ 			$.ajax({
/* 62  */ 				url:      'http://www.wpuniversity.com/wp-admin/admin-ajax.php?action=wpu_add_comment',
/* 63  */ 				context:  this,
/* 64  */ 				data:     data,
/* 65  */ 				dataType: 'json'
/* 66  */ 			}).done(function(data,e){
/* 67  */ 				console.log('Saved Comment');
/* 68  */ 				$('#wpu textarea').html('Thank You!');
/* 69  */ 				$('#wpu #review input[type="submit"]').val('Sent!');
/* 70  */ 				setTimeout(Wpu.Events.trigger('show_main_pane'),3000);
/* 71  */ 			}).error(function(e){
/* 72  */ 				console.error('Comment Save error (%o)',e);
/* 73  */ 			});
/* 74  */ 		},
/* 75  */ 
/* 76  */ 		rate: function(e){
/* 77  */ 			var data = {
/* 78  */ 				walkthrough_title: this.model.get('walkthrough_title'),
/* 79  */ 				rating:            $(e.currentTarget).data('val'),
/* 80  */ 				license:           wpu_license_key
/* 81  */ 			};
/* 82  */ 
/* 83  */ 			$(e.currentTarget).addClass('saved')
/* 84  */ 			.prevAll().addClass('saved');
/* 85  */ 
/* 86  */ 			$('#wpu .rate span').unbind('mouseenter mouseleave click').css({cursor: 'default'});
/* 87  */ 
/* 88  */ 			$.ajax({
/* 89  */ 				url:      'http://www.wpuniversity.com/wp-admin/admin-ajax.php?action=wpu_add_rating',
/* 90  */ 				context:  this,
/* 91  */ 				data:     data,
/* 92  */ 				dataType: 'json'
/* 93  */ 			}).done(function(data,e){
/* 94  */ 				console.log('Saved Rating');
/* 95  */ 				$('#wpu .hover').addClass('saved');
/* 96  */ 
/* 97  */ 			}).error(function(e){
/* 98  */ 				console.error('Rating Save error (%o)',e);
/* 99  */ 			});
/* 100 */ 

/* reviewView.js */

/* 101 */ 		}
/* 102 */ 
/* 103 */ 	});
/* 104 */ 
/* 105 */ }(jQuery));

;
/* coreModel.js */

/* 1  */ (function($) {
/* 2  */ 
/* 3  */ 	Wpu.Models.Core = Backbone.Model.extend({
/* 4  */ 		defaults: {
/* 5  */ 			library:      null
/* 6  */ 		},
/* 7  */ 
/* 8  */ 		initialize: function(){
/* 9  */ 			console.group('Initialize Core Model %o',this);
/* 10 */ 			this.view = new Wpu.Views.Core({model: this, el: $("#wpu > ul")});
/* 11 */ 			console.groupEnd();
/* 12 */ 		}
/* 13 */ 	});
/* 14 */ 
/* 15 */ }(jQuery));

;
/* listModel.js */

/* 1  */ (function($) {
/* 2  */ 
/* 3  */ 	Wpu.Models.List = Backbone.Model.extend({
/* 4  */ 		defaults: {
/* 5  */ 			library:      null
/* 6  */ 		},
/* 7  */ 
/* 8  */ 		initialize: function(){
/* 9  */ 			console.group('Initialize List Model %o',this);
/* 10 */ 			this.view = new Wpu.Views.List({model: this, el: $("#wpu > ul")});
/* 11 */ 			console.groupEnd();
/* 12 */ 		}
/* 13 */ 	});
/* 14 */ 
/* 15 */ }(jQuery));

;
/* pluginModel.js */

/* 1  */ (function($) {
/* 2  */ 
/* 3  */ 	Wpu.Models.Plugin = Backbone.Model.extend({
/* 4  */ 		defaults: {
/* 5  */ 			library:      null
/* 6  */ 		},
/* 7  */ 
/* 8  */ 		initialize: function(){
/* 9  */ 			console.group('Initialize Plugin Model %o',this);
/* 10 */ 			this.view = new Wpu.Views.Plugin({model: this, el: $("#wpu > ul")});
/* 11 */ 			console.groupEnd();
/* 12 */ 		}
/* 13 */ 	});
/* 14 */ 
/* 15 */ }(jQuery));

;
/* trackingModel.js */

/* 1  */ (function($) {
/* 2  */ 
/* 3  */ 	Wpu.Models.Tracking = Backbone.Model.extend({
/* 4  */ 		defaults : {
/* 5  */ 			gaAccountID : 'UA-39283622-1'
/* 6  */ 		},
/* 7  */ 
/* 8  */ 		initialize: function(){
/* 9  */ 			Wpu.Events.on('track_open_wpu_window', this.track_open_wpu_window, this);
/* 10 */ 			Wpu.Events.on('track_explore', this.track_explore, this);
/* 11 */ 			Wpu.Events.on('wpu_activate', this.wpu_activate, this);
/* 12 */ 			Wpu.Events.on('wpu_deactivate', this.wpu_deactivate, this);
/* 13 */ 			Wpu.Events.on('track_error', this.track_error, this);
/* 14 */ 
/* 15 */ 			window._gaq = window._gaq || [];
/* 16 */ 			window._gaq.push(['wpu._setAccount', this.get('gaAccountID')]);
/* 17 */ 
/* 18 */ 			(function() {
/* 19 */ 				var ga_wpu = document.createElement('script'); ga_wpu.type = 'text/javascript'; ga_wpu.async = true;
/* 20 */ 				ga_wpu.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
/* 21 */ 				var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga_wpu, s);
/* 22 */ 			})();
/* 23 */ 		},
/* 24 */ 
/* 25 */ 		send: function(data){
/* 26 */ 			model = window.wpu || {};
/* 27 */ 
/* 28 */ 			data = data || {};
/* 29 */ 			data.source = 'plugin';
/* 30 */ 			data.action = 'track';
/* 31 */ 			data.data = JSON.stringify(model);
/* 32 */ 			data.user = wpu_license_key;
/* 33 */ 			console.log('send tracking to WPU',data);
/* 34 */ 			$.post("http://www.wpuniversity.com/wp-admin/admin-ajax.php", data);
/* 35 */ 		},
/* 36 */ 
/* 37 */ 		track_explore: function(data){
/* 38 */ 			window._gaq.push(['wpu._trackEvent', 'Plugin - Explore', data.what, null, 0,true]);
/* 39 */ 			this.send({type: 'explore', label: data.what});
/* 40 */ 		},
/* 41 */ 
/* 42 */ 		track_open_wpu_window: function(data){
/* 43 */ 			window._gaq.push(['wpu._trackEvent', 'Plugin - Window', 'Open', data.position, 0,true]);
/* 44 */ 			this.send({type: 'open'});
/* 45 */ 		},
/* 46 */ 
/* 47 */ 		wpu_activate: function(data){
/* 48 */ 			window._gaq.push(['wpu._trackEvent', 'Plugin - Activate', '', wpu_plugin_version, 0,true]);
/* 49 */ 			this.send({type: 'activate'});
/* 50 */ 		},

/* trackingModel.js */

/* 51 */ 
/* 52 */ 		wpu_deactivate: function(data){
/* 53 */ 			window._gaq.push(['wpu._trackEvent', 'Plugin - Deactivate', '', wpu_plugin_version, 0,true]);
/* 54 */ 			this.send({type: 'deactivate'});
/* 55 */ 		},
/* 56 */ 
/* 57 */ 		track_error: function(data){
/* 58 */ 			window._gaq.push(['wpu._trackEvent', 'Plugin', 'Error', data.msg,null,true]);
/* 59 */ 			this.send({type: 'error', label: data.msg});
/* 60 */ 		}
/* 61 */ 
/* 62 */ 	});
/* 63 */ 
/* 64 */ }(jQuery));
/* 65 */ 
/* 66 */ 
/* 67 */ 

;
/* reviewModel.js */

/* 1  */ (function($) {
/* 2  */ 
/* 3  */ 	Wpu.Models.Review = Backbone.Model.extend({
/* 4  */ 		defaults: {
/* 5  */ 			walkthrough_title: null
/* 6  */ 		},
/* 7  */ 
/* 8  */ 		initialize: function(){
/* 9  */ 			this.view = new Wpu.Views.Review({model: this, el: $("#wpu > ul")});
/* 10 */ 		}
/* 11 */ 	});
/* 12 */ 
/* 13 */ }(jQuery));

;
/* helpers.js */

/* 1  */ (function($) {
/* 2  */ 
/* 3  */ 	Wpu.Helpers = ({
/* 4  */ 		preventScrolling: function(){
/* 5  */ 			$('#wpu ul.main, #wpu ul.list').on('DOMMouseScroll mousewheel', function(ev) {
/* 6  */ 				var $this = $(this),
/* 7  */ 				scrollTop = this.scrollTop,
/* 8  */ 				scrollHeight = this.scrollHeight,
/* 9  */ 				height = $this.height(),
/* 10 */ 				delta = (ev.type == 'DOMMouseScroll' ?
/* 11 */ 					ev.originalEvent.detail * -40 :
/* 12 */ 					ev.originalEvent.wheelDelta),
/* 13 */ 				up = delta > 0;
/* 14 */ 
/* 15 */ 				var prevent = function() {
/* 16 */ 					ev.stopPropagation();
/* 17 */ 					ev.preventDefault();
/* 18 */ 					ev.returnValue = false;
/* 19 */ 					return false;
/* 20 */ 				};
/* 21 */ 
/* 22 */ 				if (!up && -delta > scrollHeight - height - scrollTop) {
/* 23 */                     // Scrolling down, but this will take us past the bottom.
/* 24 */                     $this.scrollTop(scrollHeight);
/* 25 */                     return prevent();
/* 26 */                 } else if (up && delta > scrollTop) {
/* 27 */ 					// Scrolling up, but this will take us past the top.
/* 28 */ 					$this.scrollTop(0);
/* 29 */ 					return prevent();
/* 30 */ 				}
/* 31 */ 			});
/* 32 */ 		}
/* 33 */ 	});
/* 34 */ }(jQuery));
/* 35 */ 
/* 36 */ 

;
/* groupCollection.js */

/* 1  */ (function($) {
/* 2  */ 
/* 3  */ 	Wpu.Collections.Group = Backbone.Collection.extend({
/* 4  */ 		model: Wpu.Models.Group,
/* 5  */ 		initialize: function(models, options) {
/* 6  */ 			console.group('%cinitialize: Group Collection %o', 'color:#3b4580', arguments);
/* 7  */ 			console.groupEnd();
/* 8  */ 		}
/* 9  */ 	});
/* 10 */ 
/* 11 */ }(jQuery));

;
/* templates.js */

/* 1   */ _.templateSettings.interpolate = /\{\{(.*?)\}\}/;
/* 2   */ 
/* 3   */ Wpu.Templates.App = [
/* 4   */ 	"<div id='wpu' class='wpu_container'>",
/* 5   */ 		"<ul class='main'>",
/* 6   */ 			"<li id='main_menu' class='current_window'>",
/* 7   */ 				"<h2><button class='config'></button>What do you need help with?<button class='close'></button></h2>",
/* 8   */ 				"<div class='search'><!--<input type='text' value='Search'></input>--></div>",
/* 9   */ 				"<ul class='list big'>",
/* 10  */ 					"<% if (current_plugin_count > 0) { %>",
/* 11  */ 						"<li class='group_section' id='current_plugin'><div><% print(current_plugin) %><span><% print(current_plugin_count) %></span></div></li>",
/* 12  */ 					"<% } %>",
/* 13  */ 					"<% if (core_count > 0) { %>",
/* 14  */ 						"<li class='group_section' id='wordpress_general'><div>WordPress General<span><% print(core_count) %></span></div></li>",
/* 15  */ 					"<% } %>",
/* 16  */ 					"<% if (my_plugins_count > 0) { %>",
/* 17  */ 						"<li class='group_section' id='my_plugins'><div>My Plugins <span><% print(my_plugins_count) %></span></div></li>",
/* 18  */ 					"<% } %>",
/* 19  */ 					"<% if (wpu_plugins_count > 0) { %>",
/* 20  */ 						"<li class='group_section' id='wpu_plugins'><div>Other Plugins <span><% print(wpu_plugins_count) %></span></div></li>",
/* 21  */ 					"<% } %>",
/* 22  */ 					"<% if (current_plugin_count == 0) { %><li class='spacer'></li>	<% } %>	",
/* 23  */ 					"<% if (core_count == 0) { %>",
/* 24  */ 						"<li class='spacer'></li>	<% } %>	<% if (my_plugins_count == 0) { %>",
/* 25  */ 						"<li class='spacer'></li>	",
/* 26  */ 					"<% } %>",
/* 27  */ 					"<!--<li><button id='goto_library'>Goto Library</button></li>-->",
/* 28  */ 				"</ul>	",
/* 29  */ 			"</li>",
/* 30  */ 		"</ul>",
/* 31  */ 		"<div id='logo'></div><a href='http://www.wpuniversity.com'><div id='logo_full'></div></a>	",
/* 32  */ 	"</div>"
/* 33  */ 
/* 34  */ ].join("");
/* 35  */ 
/* 36  */ 
/* 37  */ Wpu.Templates.Walkthroughs = [
/* 38  */ 	"<li id='<% print(group_id) %>' class='walkthrough_listing new_window'>",
/* 39  */ 		"<h2><button class='goback'></button><% print(title) %><button class='close'></button></h2>",
/* 40  */ 		"<div class='search'><!--<input type='text' value='Search'></input>--></div>",
/* 41  */ 		"<ul class='list small'>",
/* 42  */ 			"<% if (overview_count > 0) { %>",
/* 43  */ 				"<li class='heading'><div>Overviews</div></li>",
/* 44  */ 				"<li>",
/* 45  */ 					"<ul class='walkthroughs'>",
/* 46  */ 						"<% _.each(overview_walkthroughs, function(walkthrough){ %>            ",
/* 47  */ 							"<a class='wpu_play_walkthrough' href='javascript: lara.play_walkthrough(\"<% print(walkthrough.id) %>\")'>",
/* 48  */ 								"<li><div><% print(walkthrough.title) %></div></li>",
/* 49  */ 							"</a>",
/* 50  */ 						"<% }); %>",

/* templates.js */

/* 51  */ 					"</ul>",
/* 52  */ 				"</li>",
/* 53  */ 			"<% } %>",
/* 54  */ 			"<% if (howto_count > 0) { %>",
/* 55  */ 				"<li class='heading'><div>How Tos</div></li>",
/* 56  */ 				"<li>",
/* 57  */ 					"<ul class='walkthroughs'>",
/* 58  */ 						"<% _.each(howto_walkthroughs, function(walkthrough){ %>",
/* 59  */ 							"<a class='wpu_play_walkthrough' href='javascript: lara.play_walkthrough(\"<% print(walkthrough.id) %>\")'>",
/* 60  */ 								"<li><div><% print(walkthrough.title) %></div></li>",
/* 61  */ 							"</a>",
/* 62  */ 						"<% }); %>",
/* 63  */ 					"</ul>",
/* 64  */ 				"</li>",
/* 65  */ 			"<% } %>",
/* 66  */ 		"</ul>",
/* 67  */ 	"</li>"
/* 68  */ ].join("");
/* 69  */ 
/* 70  */ Wpu.Templates.List = [
/* 71  */ 	"<li id='<% print(group_id) %>' class='plugin_listing new_window'>",
/* 72  */ 		"<h2><button class='goback'></button>Choose a Plugin<button class='close'></button></h2>",
/* 73  */ 			"<div class='search'>",
/* 74  */ 				"<!--<input type='text' value='Search'></input>-->",
/* 75  */ 			"</div>",
/* 76  */ 			"<ul class='list big'>",
/* 77  */ 				"<% _.each(plugins, function(plugin){ %>",
/* 78  */ 					"<li class='plugin' data-pluginName='<% print(plugin.plugin) %>' id='plugin_<% print(plugin.data.id) %>'>",
/* 79  */ 						"<div><% print(plugin.plugin) %><span><% print(plugin.data.count) %></span></div>",
/* 80  */ 					"</li>",
/* 81  */ 				"<% }); %>",
/* 82  */ 			"</ul>",
/* 83  */ 	"</li>"
/* 84  */ ].join("");
/* 85  */ 
/* 86  */ Wpu.Templates.Review = [
/* 87  */ 	"<li id='review' class='new_window'>",
/* 88  */ 		"<h2><button class='goback'></button>How did we do?<button class='close'></button></h2>",
/* 89  */ 		"<ul class='content'>",
/* 90  */ 			"<li>",
/* 91  */ 				"<div><div class='rate'><span data-val='1' class='rate1'></span><span data-val='2' class='rate2'></span><span data-val='3' class='rate3'></span><span data-val='4' class='rate4'></span><span data-val='5' class='rate5'></span></div>",
/* 92  */ 				"<textarea name='comment'>Let us know if you found the Walkthrough helpful or if we can improve something.</textarea>",
/* 93  */ 				"<br/><input type='button' value='Skip'></input><input type='submit' value='Submit'></input>",
/* 94  */ 				"<div class='clearfix'></div.",
/* 95  */ 			"</div></li>",
/* 96  */ 		"</ul>",
/* 97  */ 	"</li>"
/* 98  */ ].join("");
/* 99  */ 
/* 100 */ // for( var temp in Wpu.Templates){

/* templates.js */

/* 101 */ // 	if (Wpu.Templates.hasOwnProperty(temp)) {
/* 102 */ // 		Wpu.Templates[temp] = _.template(Wpu.Templates[temp]);
/* 103 */ // 	}
/* 104 */ // }
/* 105 */ 
/* 106 */ 

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
/* wpu.js */

/* 1  */ 
/* 2  */ jQuery(document).ready(function($) {
/* 3  */ 	// console.info('wpu_license_status %o', wpu_license_status);
/* 4  */ 	// console.info('wpu_library_file %o', wpu_library_file);
/* 5  */ 	var wpu = window.wpu = new Wpu.Models.App();
/* 6  */ 
/* 7  */ 	// jQuery('#logo').trigger('click');
/* 8  */ 	// wpu.show_review('test');
/* 9  */ });
/* 10 */ 
