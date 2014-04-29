/*! sidekick - v1.2 - 2014-04-29 */(function(jQuery, window){

jQuery.fn.center = function () {
	this.css("position","absolute");
	this.css("top", Math.max(0, ((jQuery(window).height() - jQuery(this).outerHeight()) / 2) +
		jQuery(window).scrollTop()) + "px");
	this.css("left", Math.max(0, ((jQuery(window).width() - jQuery(this).outerWidth()) / 2) +
		jQuery(window).scrollLeft()) + "px");
	return this;
}

})(jQuery, window);;// http://stackoverflow.com/questions/1225102/jquery-event-to-trigger-action-when-a-div-is-made-visible

(function ($, document, undefined) {



  var _oldShow = $.fn.show;

  $.fn.show = function(speed, oldCallback) {
    return $(this).each(function() {
      var obj         = $(this),
          newCallback = function() {
            if ($.isFunction(oldCallback)) {
              oldCallback.apply(obj);
            }
            obj.trigger('afterShow');
          };

      // you can trigger a before show if you want
      obj.trigger('beforeShow');

      // now use the old function to show the element passing the new callback
      _oldShow.apply(obj, [speed, newCallback]);
    });
  };

})(jQuery, document);;/**

 * timing.jquery.js
 *
 * JavaScript functions for waiting / repeating / stopping jQuery actions.
 *
 * This code is published under the MIT License (MIT).
 * http://www.opensource.org/licenses/mit-license.php
 *
 * For examples, reference, and other information see
 * http://creativecouple.github.com/jquery-timing/
 *
 * @author CreativeCouple
 * @author Peter Liske
 * @copyright (c) 2011 by CreativeCouple
 * @see http://creativecouple.github.com/jquery-timing/
 */

(function(jQuery, window){
	/**
	 * object to store statically invoked threads
	 */
	var THREAD_GROUPS = {},

	/**
	 * unique timing identifier for different purposes
	 */
	tuid = 1,

	/**
	 * remember original core function $.each()
	 */
	originalEach = jQuery.fn.each,

	/**
	 * remember original core function $.on() (or $.bind())
	 */
	originalOn = jQuery.fn.on || jQuery.fn.bind,

	/**
	 * remember original core function $.off() (or $.unbind())
	 */
	originalOff = jQuery.fn.off || jQuery.fn.unbind,

	/**
	 * .until() and .all() have special meanings
	 */
	loopEndMethods = {};

	function sameOrNextJQuery(before, after) {
		after = jQuery(after);
		after.prevObject = before;
		var i = before.length;
		if (i !== after.length) {
			return after;
		}
		while (i--) {
			if (before[i] !== after[i]) {
				return after;
			}
		}
		return before;
	}

	function loopCounts(loops) {
		var ret = [], i = loops.length;
		while (i--) {
			ret[i] = loops[i]._count;
		}
		return ret;
	}

	/**
	 * Initialize a new timed invocation chain.
	 *
	 * @author CreativeCouple
	 * @author Peter Liske
	 *
	 * @param context initial context
	 * @param methodStack linked list of methods that has been or will be filled by someone else
	 * @param ongoingLoops optional arguments for callback parameters
	 * @param onStepCallback function to call on each step
	 * @returns the timed invocation chain method
	 */
	function createTimedInvocationChain(context, methodStack, ongoingLoops, onStepCallback) {
		ongoingLoops = ongoingLoops || [];
		var executionState = {
				_context: context,
				_method: methodStack
		},
		preventRecursion = false,
		method, otherExecutionState, deferred;

		function hookupToProxy(state, mockup){
			state._canContinue = false;
			function fire(){
				state._next = sameOrNextJQuery(state._context, state._next);
				state._canContinue = true;
				timedInvocationChain();
			}
			return typeof mockup.promise == "function" ? mockup.promise().then(fire) : mockup.then(fire, true);
		}

		/**
		 * Invoke all the methods currently in the timed invocation chain.
		 *
		 * @author CreativeCouple
		 * @author Peter Liske
		 */
		function timedInvocationChain(deferredReturnValue) {
			while (!preventRecursion) try {
				// keep recursive calls away
				preventRecursion = !preventRecursion;
				// save current context state
				if (typeof onStepCallback == "function") {
					onStepCallback(jQuery.makeArray(executionState._next || executionState._context));
				}
				// leave the chain when waiting for a trigger
				if (executionState._canContinue == false) {
					break;
				}
				// check end of chain
				if (!executionState._method._name) {
					if (deferred && (!ongoingLoops.length || ongoingLoops[0]._allowPromise)) {
						// resolve any waiting promise
						if (executionState._context && typeof executionState._context.promise == "function") {
							executionState._context.promise().then(deferred.resolve);
						} else {
							deferred.resolveWith(executionState._context);
						}
						deferred = null;
					}
					if (!ongoingLoops.length) {
						/*
						 * We've reached the end of our TIC
						 * and there is nothing left to wait for.
						 * So we can safely return the original jQuery object
						 * hence enabling instant invocation.
						 */
						return executionState._context;
					}
					/*
					 * Now we have ongoing loops but reached the chain's end.
					 */
					otherExecutionState = ongoingLoops[0]._openEndAction && ongoingLoops[0]._openEndAction(timedInvocationChain, executionState, ongoingLoops);
					if (!otherExecutionState) {
						// if innermost loop can't help us, just leave the chain
						break;
					}
					executionState = otherExecutionState;
					continue;
				}
				// check if user tries to use a non-existing function call
				method = executionState._context && executionState._context[executionState._method._name] || loopEndMethods[executionState._method._name];
				if (!method) {
					throw 'no such method "'+executionState._method._name+'" on object ('+executionState._context+')';
				}
				// check whether we came here triggered or not
				if (method.timing && !executionState._canContinue) {
					// prevent automatic re-trigger in case of loops
					executionState._canContinue = false;
					// handle timing method
					executionState = method.timing(timedInvocationChain, executionState, ongoingLoops, onStepCallback) || executionState;
				} else {
					if (!method.timing && !executionState._canContinue) {
						// prevent automatic re-trigger in case of loops
						executionState._next = executionState._context[executionState._method._name].apply(executionState._context, executionState._method._arguments);
						if (ongoingLoops.length && executionState._next && executionState._next instanceof PredictingProxy) {
							hookupToProxy(executionState, executionState._next);
							continue;
						}
					}
					// go to next step
					otherExecutionState = {
							_context: executionState._next,
							_method: executionState._method._next
					};
					// prevent automatic re-trigger in case of loops
					executionState._canContinue = false;
					// invoke callback method with given arguments
					if (typeof executionState._callback == "function") {
						executionState._callback.apply(executionState._context, loopCounts(ongoingLoops));
					}
					executionState = otherExecutionState;
				}
			} catch(e) {
				/*
				 * We had a runtime exception.
				 * In plain JavaScript live the chain would break now.
				 * So we do, too.
				 */
				preventRecursion = !preventRecursion;
				throw e;
			} finally {
				preventRecursion = !preventRecursion;
			}
			return deferredReturnValue;
		};
		if (jQuery.Deferred) {
			// add .promise() method to tic
			timedInvocationChain.promise = function(type, target){
				var ret = (deferred = deferred || jQuery.Deferred()).promise(target);
				timedInvocationChain();
				return ret;
			};
		}
		return timedInvocationChain;
	}

	/**
	 * Create a placeholder object to collect chained method calls.
	 *
	 * @author CreativeCouple
	 * @author Peter Liske
	 *
	 * @param context initial context
	 * @param methodStack a linked list that this placeholder will fill with call parameters
	 * @return the placeholder object
	 */
	function PredictingProxy(context, methodStack, onStepCallback) {
		this['.methods'] = methodStack;
		this['.callback'] = onStepCallback;
		this.length = 0;
		Array.prototype.push.apply(this, jQuery.makeArray(this._ = context._ = context));

		for (var key in context) {
			if (!(key in PredictingProxy.prototype) && typeof context[key] == "function") {
				this[key] = extendMockupPrototype(key);
			}
		}
	}

	// enabling jQuery.when(tic);
	if (jQuery.Deferred) {
		PredictingProxy.prototype.promise = function(type, target) {
			if (typeof type == "object") {
				target = type;
				type = null;
			}
			return (this['.callback'] && typeof this['.callback'].promise == "function") ? this['.callback'].promise(type, target) : jQuery.Deferred().resolveWith(this).promise(target);
		};
	}

	/**
	 * Create and return a new placeholder function on the prototype of PredictingProxy.
	 */
	function extendMockupPrototype(name){
		return PredictingProxy.prototype[name] = function(){
			this['.methods']._name = name;
			this['.methods']._arguments = arguments;
			this['.methods'] = this['.methods']._next = {};
			return this['.callback'] ? this['.callback'](this, name, arguments) : this;
		};
	}


	/**
	 * Create replacement methods for .bind(), .on(), .one(), .live(), and .delegate()
	 * that support chaining instead of giving a callback function.
	 */
	jQuery.each(['bind','on','one','live','delegate'], function(index, name){
		if (jQuery.fn[name]) {
			var original = jQuery.fn[name];
			jQuery.fn[name] = function(){
				var i, methodStack, placeholder, timedInvocationChain, deferred, context = this;
				for(i=0; i<arguments.length; i++) {
					if (typeof arguments[i] == "function" || (arguments[i] && typeof arguments[i] == "object") || arguments[i] === false) {
						if (arguments[i] !== jQuery) {
							// fix for jQuery 1.6 .one() + .unbind()
							if (typeof arguments[i] == "function" && jQuery.guid) {
								arguments[i].guid = arguments[i].guid || jQuery.guid++;
							}
							return original.apply(context, arguments);
						}
						break;
					}
				}
				Array.prototype.splice.call(arguments, i, 1, function(){
					timedInvocationChain = createTimedInvocationChain(context.$(this), methodStack, [{
							_count: jQuery.extend(Array.prototype.shift.apply(arguments), arguments),
							_allowPromise: true
						}], function(elements){
						placeholder.length = 0;
						Array.prototype.push.apply(placeholder, elements);
					});
					if (deferred) {
						timedInvocationChain.promise().then(deferred.resolve);
						deferred = null;
					}
					return timedInvocationChain();
				});
				function fire(){
					return timedInvocationChain ? timedInvocationChain(placeholder) : placeholder;
				}
				if (jQuery.Deferred) {
					fire.promise = function(type, target){
						if (typeof type == "object") {
							target = type;
							type = null;
						}
						return (timedInvocationChain && !type) ? timedInvocationChain.promise(type, target) : (deferred = deferred || jQuery.Deferred()).promise(target);
					};
				}
				return placeholder = new PredictingProxy(original.apply(context, arguments), methodStack = {}, fire);
			};
		}
	});

	/**
	 * Create replacement method for .animate() and .load()
	 * that support chaining if $ is given as callback function.
	 */
	jQuery.each(['animate','load'], function(index, name){
		if (jQuery.fn[name]) {
			var original = jQuery.fn[name];
			jQuery.fn[name] = function(){
				while (arguments.length && arguments[arguments.length-1] == null) {
					Array.prototype.pop.apply(arguments);
				}
				if (this.length && arguments.length > 1 && arguments[arguments.length-1] === jQuery) {
					var event = '_timing'+tuid++;
					arguments[arguments.length-1] = function(){
						jQuery(this).trigger(event);
					};
					return this.each().one(event).all(original.apply(this, arguments));
				}
				return original.apply(this, arguments);
			};
		}
	});

	/**
	 * Define new methods .wait(), .repeat(), .join(), .then()
	 * which will always start a new TIC if invoked outside of a TIC.
	 */
	jQuery.each(['wait','repeat','join','then'], function(index, name){
		jQuery.fn[name] = function(){
			var methodStack = {},
			placeholder = new PredictingProxy(this, methodStack, createTimedInvocationChain(this, methodStack, [], function(elements){
					placeholder.length = 0;
					Array.prototype.push.apply(placeholder, elements);
				}));
			return placeholder[name].apply(placeholder, arguments);
		};
	});

	/**
	 * Define to wait for joining all animation queues.
	 *
	 * @param timedInvocationChain
	 * @param executionState
	 */
	jQuery.fn.join.timing = function(timedInvocationChain, executionState) {
		var queueName,
		promising,
		waitingElements = executionState._context.length;

		if (typeof executionState._method._arguments[0] == "string") {
			queueName = executionState._method._arguments[0];
			if (typeof executionState._method._arguments[1] == "function") {
				executionState._callback = executionState._method._arguments[1];
			} else {
				promising = executionState._method._arguments[1];
				executionState._callback = executionState._method._arguments[2];
			}
		} else {
			if (typeof executionState._method._arguments[0] == "function") {
				executionState._callback = executionState._method._arguments[0];
			} else {
				promising = executionState._method._arguments[0];
				executionState._callback = executionState._method._arguments[1];
			}
		}

		executionState._next = executionState._context;
		executionState._canContinue = !waitingElements;

		// wait for each element to reach the current end of its queue
		if (promising) {
			executionState._context.promise(queueName == null ? 'fx' : queueName).then(function(){
				executionState._canContinue = true;
				timedInvocationChain();
			});
		} else {
			executionState._context.queue(queueName == null ? 'fx' : queueName, function(next){
				executionState._canContinue = !--waitingElements;
				timedInvocationChain();
				next();
			});
		}
	};

	/**
	 * Define to simply run callback method for .then()
	 *
	 * @param timedInvocationChain
	 * @param executionState
	 */
	jQuery.fn.then.timing = function(timedInvocationChain, executionState){
		executionState._callback = executionState._method._arguments[0];
		executionState._next = executionState._context;
		executionState._canContinue = true;
		if (executionState._method._arguments[1]) {
			Array.prototype.shift.apply(executionState._method._arguments);
		}
	};

	/**
	 * Define timeout or binding to wait for.
	 *
	 * @param timedInvocationChain
	 * @param executionState
	 */
	jQuery.fn.wait.timing = function(timedInvocationChain, executionState, ongoingLoops) {
		var trigger, event, timeout, context = executionState._context;

		trigger = executionState._method._arguments[0];
		executionState._callback = executionState._method._arguments[1];

		function triggerAction() {
			originalOff.call(event ? originalOff.call(context, event, triggerAction) : context, 'unwait', unwaitAction);
			executionState._canContinue = true;
			executionState._next = sameOrNextJQuery(executionState._context, executionState._next);
			timedInvocationChain();
		}

		function unwaitAction(evt, skipWait){
			originalOff.call(event ? originalOff.call(jQuery(this), event, triggerAction) : jQuery(this), 'unwait', unwaitAction);
			context = context.not(this);
			if (!skipWait) {
				executionState._next = executionState._next.not(this);
			}
			if (!context.length) {
				executionState._canContinue = executionState._next.length;
				executionState._next = sameOrNextJQuery(executionState._context, executionState._next);
				window.clearTimeout(timeout);
				executionState = { _context: context };
			}
			// just update the snapshot info
			timedInvocationChain();
		}

		originalOn.call(context, 'unwait', unwaitAction);
		executionState._next = context;

		if (trigger == null || trigger == jQuery) {
			trigger = context;
		}
		if (typeof trigger == "function") {
			trigger = trigger.apply(context, loopCounts(ongoingLoops));
		}
		if (typeof trigger == "string") {

			originalOn.call(context, event = trigger, triggerAction);

		} else if (trigger && typeof trigger.promise == "function") {

			trigger.promise().then(triggerAction);

		} else if (trigger && typeof trigger.then == "function") {

			trigger.then(triggerAction, true);

		} else {

			timeout = window.setTimeout(triggerAction, Math.max(0,trigger));

		}
	};

	/**
	 * Define to simply run callback method for .then()
	 *
	 * @param timedInvocationChain
	 * @param executionState
	 */
	jQuery.fn.each = function(callback){
		if (!callback || callback === jQuery) {
			var methodStack = {},
			placeholder = new PredictingProxy(this, methodStack, createTimedInvocationChain(this, methodStack, [], function(elements){
					placeholder.length = 0;
					Array.prototype.push.apply(placeholder, elements);
				}));
			return placeholder.each(callback);
		}
		return originalEach.apply(this, arguments);
	};

	/**
	 * Define interval or binding to repeat.
	 *
	 * @param timedInvocationChain
	 * @param executionState
	 */
	jQuery.fn.each.timing = function(timedInvocationChain, executionState, ongoingLoops, onStepCallback) {
		if (executionState._method._arguments[0] && executionState._method._arguments[0] !== jQuery) {
			executionState._canContinue = true;
			executionState._next = originalEach.apply(executionState._context, executionState._method._arguments);
			return;
		}

		var size = Math.max(executionState._context.length, 1),
		finished = 0,
		key, methodToGoOn, openLoopTimeout,
		innerTICs = [],
		innerElements = [],
		proxyPlaceholder = jQuery.extend({}, executionState._context),
		stepByStep = executionState._method._arguments[0] === jQuery;

		if (stepByStep) {
			window.setTimeout(function(){
				openLoopTimeout = true;
				timedInvocationChain();
			},0);
		}

		function spreadAction(){
			if (stepByStep) {
				if (finished < size) {
					(innerTICs[finished])();
				}
			} else {
				for (var i=0; i<size; i++) {
					(innerTICs[i])();
				}
			}
			return proxyPlaceholder;
		}

		for (key in PredictingProxy.prototype) {
			proxyPlaceholder[key] = spreadAction;
		}
		proxyPlaceholder.length = size;
		for(key=0; key<size; key++) (function(index){
			var innerLoops = ongoingLoops.slice(),
			context = executionState._context.eq(index);
			innerElements[index] = context.get();
			innerLoops.unshift({
				_count: index,
				_allAction: function(state){
					finished++;
					if (finished == size) {
						methodToGoOn = state._method._next;
					}
					timedInvocationChain();
				},
				_fixOpenLoop: loopEndMethods.all,
				_openEndAction: function(tic, state){
					if (openLoopTimeout) {
						finished++;
						if (finished == size) {
							methodToGoOn = state._method;
						}
						timedInvocationChain();
					}
				}
			});
			innerTICs[index] = createTimedInvocationChain(context, executionState._method._next, innerLoops, function(elements){
				innerElements[index] = elements;
				proxyPlaceholder.length = 0;
				for (var i=0; i<size; i++) {
					Array.prototype.push.apply(proxyPlaceholder, innerElements[i]);
				}
				if (onStepCallback)
					onStepCallback(jQuery.makeArray(proxyPlaceholder));
			});
		})(key);

		executionState._next = proxyPlaceholder;
		executionState._canContinue = true;
		executionState._openEndAction = function(tic, state){
			if (finished == size) {
				ongoingLoops.shift();
				return {
					_context: sameOrNextJQuery(executionState._context, proxyPlaceholder),
					_method: methodToGoOn
				};
			}
			var finishedBefore = finished;
			spreadAction();
			if (finished != finishedBefore) {
				return state;
			}
		};
		executionState._count = size;

		ongoingLoops.unshift(executionState);
	};

	loopEndMethods.all = function(executionState){
		jQuery.extend(executionState._method, {
			_next: jQuery.extend({}, executionState._method),
			_name: 'all',
			_arguments: []
		});
		executionState._canContinue = null;
	};
	loopEndMethods.all.timing = function(timedInvocationChain, executionState, ongoingLoops) {
		if (!ongoingLoops.length || !ongoingLoops[0]._fixOpenLoop) {
			throw '.all() method must be used after .each() only';
		}
		if (!ongoingLoops[0]._allAction) {
			ongoingLoops[0]._fixOpenLoop(executionState);
			return;
		}

		ongoingLoops[0]._allAction(executionState);
	};

	/**
	 * Define interval or binding to repeat.
	 *
	 * @param timedInvocationChain
	 * @param executionState
	 */
	jQuery.fn.repeat.timing = function(timedInvocationChain, executionState, ongoingLoops) {
		var trigger,
		firstRunNow,
		openLoopTimeout,
		event,
		interval;

		if (typeof executionState._method._arguments[0] == "function") {
			executionState._callback = executionState._method._arguments[0];
		} else if (typeof executionState._method._arguments[1] == "function") {
			trigger = executionState._method._arguments[0];
			executionState._callback = executionState._method._arguments[1];
		} else {
			trigger = executionState._method._arguments[0];
			firstRunNow = executionState._method._arguments[1];
			executionState._callback = executionState._method._arguments[2];
		}

		function triggerAction() {
			executionState._next = executionState._next || executionState._context;
			executionState._canContinue = true;
			timedInvocationChain();
		}

		function unrepeatAction(){
			originalOff.call(event ? originalOff.call(jQuery(this), event, triggerAction) : jQuery(this), 'unrepeat', unrepeatAction);
			var context = executionState._context.not(this);
			executionState._next = (executionState._next == executionState._context) ? context : executionState._next;
			executionState._context = context;
			executionState._canContinue = executionState._context.length && executionState._canContinue;
			trigger = executionState._context.length && trigger;
			window.clearInterval(!executionState._context.length && interval);
			// just update the snapshot info
			timedInvocationChain();
		}

		executionState._openEndAction = function(tic, state){
			if (executionState._canContinue || openLoopTimeout) {
				executionState._count++;
				executionState._next = executionState._next || executionState._context;
				executionState._canContinue = executionState._canContinue || (trigger && state._context && state._context.length);
				return executionState;
			}
		};

		if (trigger == null) {

			firstRunNow = trigger = true;
			window.setTimeout(function(){
				openLoopTimeout = true;
				timedInvocationChain();
			},0);

		} else {
			if (typeof trigger == "string") {
				originalOn.call(executionState._context, event = trigger, triggerAction);
			} else {
				interval = window.setInterval(triggerAction, Math.max(0, trigger));
			}
			trigger = false;
		}

		originalOn.call(executionState._context, 'unrepeat', unrepeatAction);

		executionState._next = executionState._context;
		executionState._count = 0;
		executionState._untilAction = function(end){
			if (end) {
				unrepeatAction.apply(executionState._context);
			}
			if (trigger) {
				triggerAction();
			}
		};
		executionState._fixOpenLoop = loopEndMethods.until;

		if (firstRunNow) {
			triggerAction();
		}

		ongoingLoops.unshift(executionState);
	};

	/**
	 * Defined to evaluate condition when calling .until()
	 */
	loopEndMethods.until = function(executionState){
		jQuery.extend(executionState._method, {
			_next: jQuery.extend({}, executionState._method),
			_name: 'until',
			_arguments: []
		});
		executionState._canContinue = null;
	};
	loopEndMethods.until.timing = function(timedInvocationChain, executionState, ongoingLoops) {
		if (!ongoingLoops.length || !ongoingLoops[0]._fixOpenLoop) {
			throw '.until() method must be used after .repeat() only';
		}
		if (!ongoingLoops[0]._untilAction) {
			ongoingLoops[0]._fixOpenLoop(executionState);
			return;
		}

		var condition = executionState._method._arguments[0],
		loopContext = executionState._method._arguments[1];
		if (condition === jQuery) {
			condition = null;
			loopContext = executionState._method._arguments.length <= 1 || loopContext;
		}
		if (typeof condition == "function") {
			condition = condition.apply(executionState._context, loopCounts(ongoingLoops));
		}
		if (condition == null) {
			condition = !executionState._context.size();
		}
		if (typeof condition == "object") {
			condition = condition.toString();
		}
		if (typeof condition == "number") {
			condition = ongoingLoops[0]._count >= condition-1;
		}
		if (condition) {
			executionState._canContinue = true;
			executionState._next = executionState._context;
			ongoingLoops.shift()._untilAction(condition);
		} else {
			if (loopContext) {
				ongoingLoops[0]._next = executionState._context;
			}
			executionState = ongoingLoops[0];
			executionState._count++;
			executionState._untilAction(condition);
			return executionState;
		}
	};

	// support .until() and .all()
	new PredictingProxy(loopEndMethods);

	/**
	 * Define unwait and unrepeat methods.
	 */
	jQuery.each(['unwait','unrepeat'], function(index, name){
		jQuery.fn[name] = function(){
			return this.trigger(name, arguments);
		};
	});

	/**
	 * define all static timing methods:
	 *  $.wait, $.repeat ,$.join, $.then, $.unwait, $.unrepeat
	 */
	jQuery.each(['wait','repeat','join','then','unwait','unrepeat'], function(index, name){
		jQuery[name] = function(){
			var group = typeof arguments[0] == "string" ? Array.prototype.shift.apply(arguments) : '';
			return jQuery.fn[name].apply(THREAD_GROUPS[group] = (THREAD_GROUPS[group] || jQuery('<div>').text(group)), arguments);
		};
	});

	/**
	 * X defines deferred variables that can be used in timed invocation chains
	 *
	 * @author CreativeCouple
	 * @author Peter Liske
	 */
	function X(compute, Var, calculation){
		if (typeof compute == "string") {
			calculation = new Function('x','return ['+compute+'\n,x]');
			compute = function(x, result){
				result = calculation(x);
				callbackVariable.x = result[1];
				return result[0];
			};
		}
		var hasRelatedVariable = typeof Var == "function",
		hasComputation = typeof compute == "function",

		callbackVariable = function(value) {
			if (arguments.length == 1) {
				callbackVariable.x = value;
				if (hasRelatedVariable) {
					Var(value);
				}
			} else {
				return evaluate();
			}
		};
		function evaluate(value){
			value = hasRelatedVariable ? Var() : callbackVariable.x;
			return hasComputation ? compute(value) : value;
		}

		callbackVariable.x = 0;
		callbackVariable._ = { toString: callbackVariable.$ = callbackVariable.toString = evaluate.toString = evaluate };
		callbackVariable.mod = function(val){
			return X(function(x){
				return x % val;
			}, callbackVariable);
		};
		callbackVariable.add = function(val){
			return X(function(x){
				return x + val;
			}, callbackVariable);
		};
		callbackVariable.neg = function(){
			return X('-x', callbackVariable);
		};
		// $$ only for backward compatibility
		callbackVariable.$$ = callbackVariable.X = function(compute){
			return X(compute, callbackVariable);
		};
		jQuery.each('abcdefghij', function(index, character){
			callbackVariable[index] = callbackVariable[character] = function(){
				callbackVariable(arguments[index]);
			};
		});

		return callbackVariable;
	};

	// $$ only for backward compatibility
	window.$$ = jQuery.$$ = jQuery.X = X;

	/**
	 * Define chained version of $().
	 * This allows to use .end() to come back to previous jQuery selection.
	 */
	jQuery.fn.$ = function(){
		var ret = jQuery.apply(window, arguments);
		ret.prevObject = this;
		return ret;
	};

})(jQuery, window);;/*!
 * jQuery Cookie Plugin v1.3.0
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2013 Klaus Hartl
 * Released under the MIT license
 */
(function ($, document, undefined) {

	var pluses = /\+/g;

	function raw(s) {
		return s;
	}

	function decoded(s) {
		return decodeURIComponent(s.replace(pluses, ' '));
	}

	var config = $.cookie = function (key, value, options) {

		// write
		if (value !== undefined) {
			options = $.extend({}, config.defaults, options);

			if (value === null) {
				options.expires = -1;
			}

			if (typeof options.expires === 'number') {
				var days = options.expires, t = options.expires = new Date();
				t.setDate(t.getDate() + days);
			}

			value = config.json ? JSON.stringify(value) : String(value);

			return (document.cookie = [
				encodeURIComponent(key), '=', config.raw ? value : encodeURIComponent(value),
				options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
				options.path    ? '; path=' + options.path : '',
				options.domain  ? '; domain=' + options.domain : '',
				options.secure  ? '; secure' : ''
			].join(''));
		}

		// read
		var decode = config.raw ? raw : decoded;
		var cookies = document.cookie.split('; ');
		for (var i = 0, l = cookies.length; i < l; i++) {
			var parts = cookies[i].split('=');
			if (decode(parts.shift()) === key) {
				var cookie = decode(parts.join('='));
				return config.json ? JSON.parse(cookie) : cookie;
			}
		}

		return null;
	};

	config.defaults = {};

	$.removeCookie = function (key, options) {
		if ($.cookie(key) !== null) {
			$.cookie(key, null, options);
			return true;
		}
		return false;
	};

})(jQuery, document);
;// Generated by CoffeeScript 1.6.3
/*
jQuery css-watch event Coffeescript
http://github.com/leifcr/jquery-csswatch/
(c) 2012-2013 Leif Ringstad

@author Leif Ringstad
@version 1.2.1
@date 10/27/2013

Licensed under the freeBSD license
*/


(function() {
  var ExecuteMethod,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  (function($, window, document) {
    /*
      Plugin constructor
    */

    var CssWatch;
    CssWatch = function(elem, options) {
      this.elem = elem;
      this.$elem = $(elem);
      this.options = options;
      this.cb_timer_id = null;
      this.stop_requested = false;
    };
    /*
      Plugin prototype
    */

    CssWatch.prototype = {
      defaults: {
        event_name: "css-change",
        data_attr_name: "css-watch-data",
        use_event: true,
        callback: null,
        props: "",
        props_functions: {}
      },
      /*
        Initializer
      */

      init: function() {
        this.config = $.extend({}, this.defaults, this.options, this.metadata);
        this.config.props = this.splitAndTrimProps(this.config.props);
        if (this.config.props.length > 0) {
          this.setInitialData();
          this.start();
        }
        return this;
      },
      /*
        split and trim properties
      */

      splitAndTrimProps: function(props) {
        var arr, i, ret;
        arr = props.split(",");
        ret = [];
        i = 0;
        while (i < arr.length) {
          ret.push(arr[i].trim());
          i++;
        }
        return ret;
      },
      /*
        set initial data
      */

      setInitialData: function() {
        var i;
        i = 0;
        while (i < this.config.props.length) {
          this.setData(this.config.props[i], this.getPropertyValue(this.config.props[i]));
          i++;
        }
      },
      /*
        set a data element for a css property on the current element
      */

      setData: function(property, value) {
        return this.$elem.data("" + this.config.data_attr_name + "-" + property, value);
      },
      /*
        update data attributes from changes
      */

      updateDataFromChanges: function(changes) {
        var property, value, _i, _len, _ref;
        _ref = Object.keys(changes);
        for (value = _i = 0, _len = _ref.length; _i < _len; value = ++_i) {
          property = _ref[value];
          this.setData(property, changes[property]);
        }
      },
      /*
        get the datavalue stored for a property
      */

      getDataValue: function(property) {
        return this.$elem.data("" + this.config.data_attr_name + "-" + property);
      },
      /*
        get css property value (from jquery css or from custom function if needed)
      */

      getPropertyValue: function(property) {
        var function_to_call;
        if (Object.keys(this.config.props_functions).length === 0) {
          return this.$elem.css(property);
        }
        function_to_call = null;
        if (__indexOf.call(Object.keys(this.config.props_functions), property) >= 0) {
          function_to_call = this.config.props_functions[property];
        } else {
          function_to_call === null;
        }
        if (function_to_call !== null) {
          if (window.ExecuteMethod) {
            return ExecuteMethod.executeMethodByFunctionName(function_to_call, this.$elem);
          } else {
            console.log("You are missing the ExecuteMethod library.");
          }
        }
        return this.$elem.css(property);
      },
      /*
        get object of changes
      */

      changedProperties: function() {
        var i, ret;
        i = 0;
        ret = {};
        while (i < this.config.props.length) {
          if (this.getPropertyValue(this.config.props[i]) !== this.getDataValue(this.config.props[i])) {
            ret[this.config.props[i]] = this.getPropertyValue(this.config.props[i]);
          }
          i++;
        }
        return ret;
      },
      /*
        stop csswatch / checking of css attributes
      */

      stop: function() {
        var stop_requested;
        if (typeof this.config === "undefined" || this.config === null) {
          return;
        }
        stop_requested = true;
        return window.cssWatchCancelAnimationFrame(this.cb_timer_id);
      },
      /*
        start csswatch / checking of css attributes
      */

      start: function() {
        var _this = this;
        if (typeof this.config === "undefined" || this.config === null) {
          return;
        }
        this.stop_requested = false;
        this.cb_timer_id = window.cssWatchRequestAnimationFrame(function() {
          _this.check();
        });
      },
      /*
        the actual checking of changes
      */

      check: function() {
        var changes,
          _this = this;
        if (typeof this.config === "undefined" || this.config === null) {
          return false;
        }
        if (this.stop_requested === true) {
          return false;
        }
        changes = this.changedProperties();
        if (Object.keys(changes).length > 0) {
          if (this.config.use_event) {
            this.$elem.trigger(this.config.event_name, changes);
          }
          if (this.config.callback !== null) {
            this.config.callback.apply(null, [changes]);
          }
          this.updateDataFromChanges(changes);
        }
        this.cb_timer_id = window.cssWatchRequestAnimationFrame(function() {
          _this.check();
        });
        return false;
      },
      /*
       destroy plugin (stop/remove data)
      */

      destroy: function() {
        this.stop();
        this.$elem.removeData("css-watch-object");
        this.$elem.removeData(this.config.data_attr_name);
        return null;
      }
    };
    /*
     Set defaults
    */

    CssWatch.defaults = CssWatch.prototype.defaults;
    /*
     Jquery extension for plugin
     Plugin funcitonality is in the class above
    */

    $.fn.csswatch = function(options) {
      return this.each(function() {
        var data, obj;
        if (typeof options === "object" || !options) {
          data = $(this).data("css-watch-object");
          if (!data) {
            obj = new CssWatch(this, options);
            $(this).data("css-watch-object", obj);
            obj.init();
          }
        } else if (typeof options === "string") {
          obj = $(this).data("css-watch-object");
          if (obj && obj[options]) {
            return obj[options].apply(this);
          }
        }
      });
    };
  })(jQuery, window, document);

  /*
  #
  # Cross browser Object.keys implementation
  #
  # This is suggested implementation from Mozilla for supporting browser that do not implement Object.keys
  # if object doesn't have .keys function
  # if(!Object.keys) Object.keys = function(o){
  #    if (o !== Object(o))
  #       throw new TypeError('Object.keys called on non-object');
  #    var ret=[],p;
  #    for(p in o) if(Object.prototype.hasOwnProperty.call(o,p)) ret.push(p);
  #    return ret;
  # }
  */


  if (!Object.keys) {
    Object.keys = function(o) {
      var p, ret;
      if (o !== Object(o)) {
        throw new TypeError("Object.keys called on non-object");
      }
      ret = [];
      p = void 0;
      for (p in o) {
        if (Object.prototype.hasOwnProperty.call(o, p)) {
          ret.push(p);
        }
      }
      return ret;
    };
  }

  /*
    Cross browser requestAnimationFrame
    Not including settimeout as it will have a static value for timeout
  */


  if (!window.cssWatchRequestAnimationFrame) {
    window.cssWatchRequestAnimationFrame = (function() {
      return window.webkitAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || window.requestAnimationFrame || function(callback, element) {
        return window.setTimeout(callback, 1000 / 60);
      };
    })();
  }

  /*
    Cross browser cancelAnimationFrame
  */


  if (!window.cssWatchCancelAnimationFrame) {
    window.cssWatchCancelAnimationFrame = (function() {
      return window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.webkitCancelRequestAnimationFrame || window.mozCancelAnimationFrame || window.mozCancelRequestAnimationFrame || window.oCancelRequestAnimationFrame || window.msCancelRequestAnimationFrame || function(timeout_id) {
        return window.clearTimeout(timeout_id);
      };
    })();
  }

  /*
  # Execute Method
  # (c) 2012 Leif Ringstad
  # Licensed under the freeBSD license (see LICENSE.txt for details)
  #
  # Source: http://github.com/leifcr/execute_method
  # v 1.0.0
  */


  ExecuteMethod = {
    getFunctionsAndProperties: function(str) {
      var arr, i, ret;
      arr = str.split(".");
      i = 0;
      ret = [];
      while (i < arr.length) {
        ret.push(ExecuteMethod.getFunctionAndParameters(arr[i]));
        i++;
      }
      return ret;
    },
    getFunctionAndParameters: function(str) {
      var func, isfunc, params;
      if (ExecuteMethod.isFunction(str)) {
        params = str.substring(str.indexOf("(") + 1, str.indexOf(")"));
        if (params.length > 0) {
          params = ExecuteMethod.splitAndTypeCastParameters(params);
        } else {
          params = [];
        }
        func = str.substring(0, str.indexOf("\("));
        isfunc = true;
      } else {
        func = str;
        params = null;
        isfunc = false;
      }
      return {
        func: func,
        params: params,
        isfunc: isfunc
      };
    },
    splitAndTypeCastParameters: function(params) {
      var arr, i, ret;
      arr = params.split(",");
      ret = [];
      i = 0;
      ret = [];
      while (i < arr.length) {
        ret.push(ExecuteMethod.typecastParameter(arr[i]));
        i++;
      }
      return ret;
    },
    isFunction: function(str) {
      if (ExecuteMethod.regexIndexOf(str, /(\([\d|\D]+\))|(\(\))/, 0) !== -1) {
        return true;
      }
      return false;
    },
    regexIndexOf: function(string, regex, startpos) {
      var indexOf;
      indexOf = string.substring(startpos || 0).search(regex);
      if (indexOf >= 0) {
        return indexOf + (startpos || 0);
      } else {
        return indexOf;
      }
    },
    typecastParameter: function(param) {
      param = param.trim();
      param = param.replace(/^"/, "");
      param = param.replace(/"$/m, "");
      if (param.search(/^\d+$/) === 0) {
        return parseInt(param);
      } else if (param.search(/^\d+\.\d+$/) === 0) {
        return parseFloat(param);
      } else if (param === "false") {
        return false;
      } else if (param === "true") {
        return true;
      }
      return param;
    },
    executeSingleFunction: function(func, params, context, _that) {
      return context[func].apply(_that, params);
    },
    getSingleProperty: function(property, context) {
      return context[property];
    },
    /*
    # @param {String} Provide a string on what to execute (e.g. this.is.something(true).to_run() or myFunction().property or myFunction())
    # @param {Object} Provide a object to run the string provided on
    # @param {Object} Provide an object that points to the "this" pointer which
    */

    executeMethodByFunctionName: function(str, context) {
      var current_context, current_val, func_data, i;
      func_data = ExecuteMethod.getFunctionsAndProperties(str);
      i = 0;
      current_context = context;
      current_val = null;
      while (i < func_data.length) {
        if (func_data[i]["isfunc"] === true) {
          current_context = ExecuteMethod.executeSingleFunction(func_data[i]["func"], func_data[i]["params"], current_context, context);
        } else {
          current_context = ExecuteMethod.getSingleProperty(func_data[i]["func"], current_context);
        }
        i++;
      }
      return current_context;
    }
  };

  if (!String.prototype.trim) {
    String.prototype.trim = function() {
      return this.replace(/^\s+|\s+$/g, '');
    };
  }

  if (window.ExecuteMethod === "undefined" || window.ExecuteMethod === null || window.ExecuteMethod === void 0) {
    window.ExecuteMethod = ExecuteMethod;
  }

}).call(this);;/*
 * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
 *
 * Uses the built in easing capabilities added In jQuery 1.1
 * to offer multiple easing options
 *
 * TERMS OF USE - jQuery Easing
 * 
 * Open source under the BSD License. 
 * 
 * Copyright © 2008 George McGinley Smith
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
*/

// t: current time, b: begInnIng value, c: change In value, d: duration
jQuery.easing['jswing'] = jQuery.easing['swing'];

jQuery.extend( jQuery.easing,
{
	def: 'easeOutQuad',
	swing: function (x, t, b, c, d) {
		//alert(jQuery.easing.default);
		return jQuery.easing[jQuery.easing.def](x, t, b, c, d);
	},
	easeInQuad: function (x, t, b, c, d) {
		return c*(t/=d)*t + b;
	},
	easeOutQuad: function (x, t, b, c, d) {
		return -c *(t/=d)*(t-2) + b;
	},
	easeInOutQuad: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t + b;
		return -c/2 * ((--t)*(t-2) - 1) + b;
	},
	easeInCubic: function (x, t, b, c, d) {
		return c*(t/=d)*t*t + b;
	},
	easeOutCubic: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t + 1) + b;
	},
	easeInOutCubic: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t + b;
		return c/2*((t-=2)*t*t + 2) + b;
	},
	easeInQuart: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t + b;
	},
	easeOutQuart: function (x, t, b, c, d) {
		return -c * ((t=t/d-1)*t*t*t - 1) + b;
	},
	easeInOutQuart: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
		return -c/2 * ((t-=2)*t*t*t - 2) + b;
	},
	easeInQuint: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t*t + b;
	},
	easeOutQuint: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t*t*t + 1) + b;
	},
	easeInOutQuint: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
		return c/2*((t-=2)*t*t*t*t + 2) + b;
	},
	easeInSine: function (x, t, b, c, d) {
		return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
	},
	easeOutSine: function (x, t, b, c, d) {
		return c * Math.sin(t/d * (Math.PI/2)) + b;
	},
	easeInOutSine: function (x, t, b, c, d) {
		return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
	},
	easeInExpo: function (x, t, b, c, d) {
		return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
	},
	easeOutExpo: function (x, t, b, c, d) {
		return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
	},
	easeInOutExpo: function (x, t, b, c, d) {
		if (t==0) return b;
		if (t==d) return b+c;
		if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
		return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
	},
	easeInCirc: function (x, t, b, c, d) {
		return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
	},
	easeOutCirc: function (x, t, b, c, d) {
		return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
	},
	easeInOutCirc: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
		return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
	},
	easeInElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
	},
	easeOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
	},
	easeInOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
		return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
	},
	easeInBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*(t/=d)*t*((s+1)*t - s) + b;
	},
	easeOutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
	},
	easeInOutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158; 
		if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
		return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
	},
	easeInBounce: function (x, t, b, c, d) {
		return c - jQuery.easing.easeOutBounce (x, d-t, 0, c, d) + b;
	},
	easeOutBounce: function (x, t, b, c, d) {
		if ((t/=d) < (1/2.75)) {
			return c*(7.5625*t*t) + b;
		} else if (t < (2/2.75)) {
			return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
		} else if (t < (2.5/2.75)) {
			return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
		} else {
			return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
		}
	},
	easeInOutBounce: function (x, t, b, c, d) {
		if (t < d/2) return jQuery.easing.easeInBounce (x, t*2, 0, c, d) * .5 + b;
		return jQuery.easing.easeOutBounce (x, t*2-d, 0, c, d) * .5 + c*.5 + b;
	}
});

/*
 *
 * TERMS OF USE - EASING EQUATIONS
 * 
 * Open source under the BSD License. 
 * 
 * Copyright © 2001 Robert Penner
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
 */;/*
* $ lightbox_me
* By: Buck Wilson
* Version : 2.3
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/


(function($) {

    $.fn.lightbox_me = function(options) {

        return this.each(function() {

            var
                opts = $.extend({}, $.fn.lightbox_me.defaults, options),
                $overlay = $(),
                $self = $(this),
                $iframe = $('<iframe id="foo" style="z-index: ' + (opts.zIndex + 1) + ';border: none; margin: 0; padding: 0; position: absolute; width: 100%; height: 100%; top: 0; left: 0; filter: mask();"/>'),
                ie6 = ($.browser.msie && $.browser.version < 7);

            if (opts.showOverlay) {
                //check if there's an existing overlay, if so, make subequent ones clear
               var $currentOverlays = $(".js_lb_overlay:visible");
                if ($currentOverlays.length > 0){
                    $overlay = $('<div class="lb_overlay_clear js_lb_overlay"/>');
                } else {
                    $overlay = $('<div class="' + opts.classPrefix + '_overlay js_lb_overlay"/>');
                }
            }

            /*----------------------------------------------------
               DOM Building
            ---------------------------------------------------- */
            if (ie6) {
                var src = /^https/i.test(window.location.href || '') ? 'javascript:false' : 'about:blank';
                $iframe.attr('src', src);
                $('body').append($iframe);
            } // iframe shim for ie6, to hide select elements
            $('body').append($self.hide()).append($overlay);


            /*----------------------------------------------------
               Overlay CSS stuffs
            ---------------------------------------------------- */

            // set css of the overlay
            if (opts.showOverlay) {
                setOverlayHeight(); // pulled this into a function because it is called on window resize.
                $overlay.css({ position: 'absolute', width: '100%', top: 0, left: 0, right: 0, bottom: 0, zIndex: (opts.zIndex + 2), display: 'none' });
				if (!$overlay.hasClass('lb_overlay_clear')){
                	$overlay.css(opts.overlayCSS);
                }
            }

            /*----------------------------------------------------
               Animate it in.
            ---------------------------------------------------- */
               //
            if (opts.showOverlay) {
                $overlay.fadeIn(opts.overlaySpeed, function() {
                    setSelfPosition();
                    $self[opts.appearEffect](opts.lightboxSpeed, function() { setOverlayHeight(); setSelfPosition(); opts.onLoad()});
                });
            } else {
                setSelfPosition();
                $self[opts.appearEffect](opts.lightboxSpeed, function() { opts.onLoad()});
            }

            /*----------------------------------------------------
               Hide parent if parent specified (parentLightbox should be jquery reference to any parent lightbox)
            ---------------------------------------------------- */
            if (opts.parentLightbox) {
                opts.parentLightbox.fadeOut(200);
            }


            /*----------------------------------------------------
               Bind Events
            ---------------------------------------------------- */

            $(window).resize(setOverlayHeight)
                     .resize(setSelfPosition)
                     .scroll(setSelfPosition);
                     
            $(window).bind('keyup.lightbox_me', observeKeyPress);
                     
            if (opts.closeClick) {
                $overlay.click(function(e) { closeLightbox(); e.preventDefault; });
            }
            $self.delegate(opts.closeSelector, "click", function(e) {
                closeLightbox(); e.preventDefault();
            });
            $self.bind('close', closeLightbox);
            $self.bind('reposition', setSelfPosition);

            

            /*--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
              -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */


            /*----------------------------------------------------
               Private Functions
            ---------------------------------------------------- */

            /* Remove or hide all elements */
            function closeLightbox() {
                var s = $self[0].style;
                if (opts.destroyOnClose) {
                    $self.add($overlay).remove();
                } else {
                    $self.add($overlay).hide();
                }

                //show the hidden parent lightbox
                if (opts.parentLightbox) {
                    opts.parentLightbox.fadeIn(200);
                }

                $iframe.remove();
                
				// clean up events.
                $self.undelegate(opts.closeSelector, "click");

                $(window).unbind('reposition', setOverlayHeight);
                $(window).unbind('reposition', setSelfPosition);
                $(window).unbind('scroll', setSelfPosition);
                $(window).unbind('keyup.lightbox_me');
                if (ie6)
                    s.removeExpression('top');
                opts.onClose();
            }


            /* Function to bind to the window to observe the escape/enter key press */
            function observeKeyPress(e) {
                if((e.keyCode == 27 || (e.DOM_VK_ESCAPE == 27 && e.which==0)) && opts.closeEsc) closeLightbox();
            }


            /* Set the height of the overlay
                    : if the document height is taller than the window, then set the overlay height to the document height.
                    : otherwise, just set overlay height: 100%
            */
            function setOverlayHeight() {
                if ($(window).height() < $(document).height()) {
                    $overlay.css({height: $(document).height() + 'px'});
                     $iframe.css({height: $(document).height() + 'px'}); 
                } else {
                    $overlay.css({height: '100%'});
                    if (ie6) {
                        $('html,body').css('height','100%');
                        $iframe.css('height', '100%');
                    } // ie6 hack for height: 100%; TODO: handle this in IE7
                }
            }


            /* Set the position of the modal'd window ($self)
                    : if $self is taller than the window, then make it absolutely positioned
                    : otherwise fixed
            */
            function setSelfPosition() {
                var s = $self[0].style;

                // reset CSS so width is re-calculated for margin-left CSS
                $self.css({left: '50%', marginLeft: ($self.outerWidth() / 2) * -1,  zIndex: (opts.zIndex + 3) });


                /* we have to get a little fancy when dealing with height, because lightbox_me
                    is just so fancy.
                 */

                // if the height of $self is bigger than the window and self isn't already position absolute
                if (($self.height() + 80  >= $(window).height()) && ($self.css('position') != 'absolute' || ie6)) {

                    // we are going to make it positioned where the user can see it, but they can still scroll
                    // so the top offset is based on the user's scroll position.
                    var topOffset = $(document).scrollTop() + 40;
                    $self.css({position: 'absolute', top: topOffset + 'px', marginTop: 0})
                    if (ie6) {
                        s.removeExpression('top');
                    }
                } else if ($self.height()+ 80  < $(window).height()) {
                    //if the height is less than the window height, then we're gonna make this thing position: fixed.
                    // in ie6 we're gonna fake it.
                    if (ie6) {
                        s.position = 'absolute';
                        if (opts.centered) {
                            s.setExpression('top', '(document.documentElement.clientHeight || document.body.clientHeight) / 2 - (this.offsetHeight / 2) + (blah = document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop) + "px"')
                            s.marginTop = 0;
                        } else {
                            var top = (opts.modalCSS && opts.modalCSS.top) ? parseInt(opts.modalCSS.top) : 0;
                            s.setExpression('top', '((blah = document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop) + '+top+') + "px"')
                        }
                    } else {
                        if (opts.centered) {
                            $self.css({ position: 'fixed', top: '50%', marginTop: ($self.outerHeight() / 2) * -1})
                        } else {
                            $self.css({ position: 'fixed'}).css(opts.modalCSS);
                        }

                    }
                }
            }

        });



    };

    $.fn.lightbox_me.defaults = {

        // animation
        appearEffect: "fadeIn",
        appearEase: "",
        overlaySpeed: 250,
        lightboxSpeed: 300,

        // close
        closeSelector: ".close",
        closeClick: true,
        closeEsc: true,

        // behavior
        destroyOnClose: false,
        showOverlay: true,
        parentLightbox: false,

        // callbacks
        onLoad: function() {},
        onClose: function() {},

        // style
        classPrefix: 'lb',
        zIndex: 999,
        centered: false,
        modalCSS: {top: '40px'},
        overlayCSS: {background: 'black', opacity: .3}
    }
})(jQuery);;(function($) {

	window.SidekickWP = {
		Models: {},
		Collections: {},
		Views: {},
		Events: {},
		Templates: {},
		Helpers: {}
	};

	if (!window.console) window.console = {log: function() {}};
	if (!window.console.clear) window.console.clear = function(){};
	if (!window.console.group) window.console.group = function(){};
	if (!window.console.groupEnd) window.console.groupEnd = function(){};
	if (!window.console.table) window.console.table = function(){};
	if (!window.console.error) window.console.error = function(){};
	if (!window.console.groupCollapsed) window.console.groupCollapsed = function(){};

	if (window.console){
		window.console.info = function(msg,o1,o2,o3){if (!o1) o1 = '';if (!o2) o2 = '';if (!o3) o3 = '';console.log('%c' + msg,'color: blue;font-weight: bold',o1,o2,o3);};
		window.console.event = function(msg,o1,o2,o3){if (!o1) o1 = '';if (!o2) o2 = '';if (!o3) o3 = '';console.log('%c' + msg,'color: green;font-weight: bold',o1,o2,o3);};
	}

	SidekickWP.Models.App = Backbone.Model.extend({
		defaults: {
			full_library:              null,
			buckets:                   [],
			passed_walkthroughs:       [],
			library_filtered_hotspots: [],
			paid_library:              null,
			my_library:                null,
			wp_version:                null,
			installed_plugins:         null,
			current_url:               null,
			current_plugin:            null,
			license_status:            null,
			show_toggle_feedback:      true,
			sk_debug:                  null,
			qa_mode:                   false,
			bucket_counts:             []
		},

		initialize: function(){
			// console.group('%cinitialize: App Model %o', 'color:#3b4580', this);

			if ( $.browser.msie  && $.browser.version < 9) {
				console.error('This browser is not supported');
				return false;
			}

			_.extend(this, Backbone.Events);
			SidekickWP.Events = _.extend({}, Backbone.Events);

			SidekickWP.Events.on("all", function(eventName){
				// console.log('%cPLREVENT: [ %c' + eventName + '%c ] was triggered!','background-color: #fa62bf;color: white','color: yellow; background-color: #fa4339','background-color: #fa4339;color: white');
			});

			Sidekick.Events.on('loaded_walkthrough',this.loaded_walkthrough,this);
			// Sidekick.Events.on('stop',this.show_review,this);
			Sidekick.Events.on('stop',this.deactivate_controls,this);
			Sidekick.Events.on('track_play',this.activate_controls,this);

			SidekickWP.Events.on('screen_activate',this.screen_activate,this);
			SidekickWP.Events.on('show_msg',this.show_msg,this);

			this.trackingModel = new SidekickWP.Models.Tracking();

			var matched_domain = false;

			if (sk_config.plugin_url.indexOf('qa.sidekick.pro') > -1 || sk_config.plugin_url.indexOf('local.sidekick.pro') > -1) {
				this.set('qa_mode',true);
			}

			if ((typeof sk_free_library == 'undefined' || !sk_config.library_free_file) && typeof sk_paid_library == 'undefined' || !sk_config.library_paid_file) {
				var msg = 'No Library Found!';
				SidekickWP.Events.trigger('track_error',{msg: msg});

				console.error('Sidekick Library Not Found! -> %s',sk_config.library_file);
				return;
			} else {
				if(typeof sk_paid_library !== 'undefined' && _.size(sk_paid_library.buckets) > 0){
					console.groupCollapsed('%cFOUND sk_paid_library %o', 'background-color: #51fa3d; color black;',sk_paid_library);


					var paid_library_domain = sk_paid_library.domain_name;

					if (paid_library_domain.indexOf(',') > -1) {
						var paid_library_domains = paid_library_domain.split(',');
						_.each(paid_library_domains,function(item){
							if (sk_config.site_url == item.trim()) {
								matched_domain = item;
								console.log('%cCHECK DOMAIN %o == %o', 'background-color: #51fa3d;color: white',sk_config.site_url,item);
							} else {
								console.log('%cCHECK DOMAIN %o == %o', 'background-color: #c12029;color: white',sk_config.site_url,item);
							}
						});
					} else {
						if (sk_config.site_url == paid_library_domain) {
							matched_domain = item;
						}
					}
					console.groupEnd();
				} else {
					console.log('%cNO paid library','background-color: #c12029;color: white');
					sk_config.activation_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxfree';
					if (typeof sk_free_library == 'undefined' || !sk_config.library_free_file){
						console.error('Paid Library didn\'t match domain and no free library');
						return false;
					}
				}
			}

			if (matched_domain) {
				this.set('full_library',sk_paid_library);
				this.set('paid_library',sk_paid_library);
				console.info('%cPaid Library for %s -> ' + sk_config.library_paid_file + ' (%o)', 'background-color: #51fa3d; color black;',matched_domain,sk_paid_library);
			} else {
				this.set('full_library',sk_free_library);
				console.info('%cFree Library -> ' + sk_config.library_free_file + ' (%o)', 'background-color: #facf42; color black;',sk_free_library);
			}

			if (typeof sk_config.just_activated != 'undefined')
				SidekickWP.Events.trigger('window_activate');

			if (typeof sk_config.main_soft_version === 'undefined') {
				console.error('No WP Version?!?');
				return false;
			}

			if (typeof sk_config.main_soft_version	!= 'undefined') this.set('main_soft_version',sk_config.main_soft_version);
			if (typeof sk_config.installed_plugins	!= 'undefined') this.set('installed_plugins',sk_config.installed_plugins);

			if (sk_config.track_data === true) console.log("Can't Track User Data!");

			this.set('current_url',window.location.toString());

			var http = 'http';
			if (window.location.toString().indexOf('https') > -1) {
				http = 'https';
			}

			this.views     = {};
			this.check_library();
			this.filter_walkthroughs();

			this.views.app = new SidekickWP.Views.App({model: this, el: $("body")});

			if (sk_config.show_login === true) {
				SidekickWP.Events.trigger('open_sidekick_drawer');
			}
			// console.groupEnd();
		},

		screen_activate: function(){
			SidekickWP.Events.trigger('open_sidekick_drawer');

			var activation_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
			if (sk_config.activation_id) {
				activation_id = sk_config.activation_id;
			}

			new SidekickWP.Models.User({
				'view':           'activate',
				'primary_domain': sk_config.domain,
				'activation_id':  activation_id
			});
		},

		filter_walkthroughs: function(){
			console.groupCollapsed('%cFilter Walkthroughs','color: orange');
			var library = this.get('full_library');
			_.each(library.buckets,function(item,key){
				this.filter_sub_bucket_recursive(item);
			},this);

			_.each(library.buckets,function(item,key){
				// Delete root bucket if no sub buckets
				this.check_delete_empty_sub_buckets_recrusive(item);

				if (_.size(library.buckets[key].sub_buckets) === 0 && _.size(library.buckets[key].walkthroughs) === 0) {
					// console.log('%cDELETE ROOT BUCKET -> %o(%o)','color: red',key,library.buckets[key]);
					delete(library.buckets[key]);
				}
			},this);
			console.groupEnd();
		},

		check_delete_empty_sub_buckets_recrusive: function(sub_bucket){
			// console.group('%ccheck_delete_empty_sub_buckets_recrusive %o (%o)', 'color: #d2984c;',sub_bucket.post_title,sub_bucket);

			if (_.size(sub_bucket.sub_buckets) > 0) {
				_.each(sub_bucket.sub_buckets,function(item,key){
					if (!this.check_delete_empty_sub_buckets_recrusive(item)) {
						// console.error('DELETE key %o', key);
						delete(sub_bucket.sub_buckets[key]);
					}
				},this);
				// console.groupEnd();
				return true;
			} else if (_.size(sub_bucket.sub_buckets) === 0 && _.size(sub_bucket.walkthroughs) === 0 ){
				// console.groupEnd();
				return false;
			}
			// console.groupEnd();
			return true;
		},

		filter_sub_bucket_recursive: function(sub_bucket){
			console.group('%cfilter_sub_bucket_recursive %s (%o)', 'color: orange',sub_bucket.post_title, sub_bucket);

			if (_.size(sub_bucket.sub_buckets) > 0) {
				console.log('AAA sub_bucket.sub_buckets %o', sub_bucket.sub_buckets);
				_.each(sub_bucket.sub_buckets,function(item,key){
					return this.filter_sub_bucket_recursive(item);
				},this);
			} else if (_.size(sub_bucket.walkthroughs)) {
				console.log('BBB Filter walkthrough %o', sub_bucket.walkthroughs);
				// Filter walkthrough
				sub_bucket.walkthroughs.reverse();
				var key = sub_bucket.walkthroughs.length;
				while (key--) {
					var walkthrough = sub_bucket.walkthroughs[key];
					if (!this.check_walkthrough_compatibility(walkthrough)) {
						console.error('DELETE sub_bucket.walkthroughs[key] %o', sub_bucket.walkthroughs[key]);
						sub_bucket.walkthroughs.splice(key, 1);
						continue;
					}

				// Check if Hotspot, if so move out
				if (walkthrough.type == 'hotspot') {
					_.each(walkthrough.hotspots,function(item){
						console.info('	HOTSPOT %o', item);
						var library_filtered_hotspots = this.get('library_filtered_hotspots');
						library_filtered_hotspots.push({
							url:item.url,selector:
							item.selector,id:walkthrough.id
						});
						this.set('library_filtered_hotspots',library_filtered_hotspots);
					},this);
					console.error('DELETE2 sub_bucket.walkthroughs[key] %o %o', key,sub_bucket.walkthroughs[key]);
					sub_bucket.walkthroughs.splice(key, 1);
					continue;
				}
			}
		} else {
			// Sub_bucket has no walkthroughs
			console.log('CCC Sub_bucket has no walkthroughs');
		}
		console.groupEnd();
		return false;
	},

	check_walkthrough_compatibility: function(walkthrough){
		var main_soft_version   = this.get('main_soft_version');
		var pass_main_soft_version = false, pass_theme_version = false, pass_theme = false, pass_plugin = false, pass_plugin_version = false, pass_user_level = false;
		var bucket_counts          = this.get('bucket_counts');
		var installed_plugins      = this.get('installed_plugins') ;

		// Checking Main Software Version Compatibility
		if (walkthrough.main_soft_version) {
			pass_main_soft_version = _.find(walkthrough.main_soft_version,function(val){
				if (val == main_soft_version)
					return true;
			});
		} else {
			// If no assigned main_soft_version assume not needed
			pass_main_soft_version = true;
		}


		if (!pass_main_soft_version){
			console.error('FAILED %o - SOFT_VER %o != %O',walkthrough.title, main_soft_version,walkthrough.main_soft_version);
			return false;
		}

		// Checking Theme Compatibility
		if (typeof walkthrough.theme !== 'undefined') {
			if (walkthrough.theme === sk_config.installed_theme) {
				pass_theme = true;
				if (walkthrough.theme_version) {
					pass_theme_version = _.find(walkthrough.theme_version,function(val){
						if (val == sk_config.theme_version) {
							return true;
						}
					});
				} else {
					pass_theme_version = true;
				}
			}
			if (!pass_theme || !pass_theme_version){
				console.error('FAILED %o - THEME %s (%o) != %s (%o)',walkthrough.title,walkthrough.theme_version, walkthrough.theme, pass_theme, sk_config.theme_version);
				return false;
			}
		}

		// Checking Plugin Compatibility
		if (typeof walkthrough.plugin !== 'undefined') {
			if (typeof sk_config.installed_plugins === 'undefined') return false;
			pass_plugin = _.find(sk_config.installed_plugins,function(plugin_data){
				for (var plugin in plugin_data) {
					var version = plugin_data[plugin];

					if (plugin == walkthrough.plugin || _.escape(plugin) == walkthrough.plugin) {
						pass_plugin = true;

						pass_plugin_version = _.find(walkthrough.plugin_version,function(version2){
							if (version == version2) {
								pass_plugin_version = true;
								return true;
							}
						});
						return true;
					}
					break;
				}
			});

			if (!pass_plugin) {
				console.error('FAILED %o (%o) - PLUGIN %s (%o)',walkthrough.title, walkthrough, walkthrough.plugin, sk_config.installed_plugins);
				return false;
			}
			if (!pass_plugin_version){
				console.error('FAILED %o (%o) - PLUGIN %s VER %s (%o)',walkthrough.title, walkthrough, walkthrough.plugin, walkthrough.plugin_version, sk_config.installed_plugins);
				return false;
			}
		}

		// Checking User Role/Level Compatibility
		if (walkthrough.role) {
			pass_user_level = _.find(walkthrough.role,function(val){
				if (val == sk_config.user_level) {
					return true;
				}
			});
		} else {
			// No User Level Defined so assume not needed
			pass_user_level = true;
		}

		if (!pass_user_level){
			console.error('FAILED %o - User Level %s != %s',walkthrough.title, sk_config.user_level, walkthrough.role);
			return false;
		}

		var passed_walkthroughs = this.get('passed_walkthroughs');
		passed_walkthroughs.push(walkthrough.id);
		this.set('passed_walkthroughs',passed_walkthroughs);

		if (walkthrough.plugin) {
			console.log('%cPASSED! %o', 'color: #3ab00b',walkthrough.plugin + ': ' + walkthrough.title);
		} else {
			console.log('%cPASSED! %o', 'color: #3ab00b',walkthrough.title);
		}

		return true;
	},

	check_library: function(){
		if (!this.get('full_library')) {
			console.error("WPU Library Not Found!");
			return false;
		}
		if (!this.get('main_soft_version')){
			console.error("No WP Version Found!");
			return false;
		}
	},

	loaded_walkthrough: function(walkthrough_model){
		// console.log('WPU:loaded_walkthrough');
		this.set('last_loaded_walkthrough',walkthrough_model);
	},

	activate_controls: function(){
		console.log('activate_controls');
		$('div#sidekick').addClass('playing');
	},

	deactivate_controls: function(){
		$('div#sidekick').removeClass('playing');
	},

	show_msg: function(data,context){
		// console.log('show_msg %o',arguments);
		new SidekickWP.Models.Message({title: data.title, message: data.msg});
	},
	getParameterByName: function(name) {
		name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		results = regex.exec(location.search);
		return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}
});
}(jQuery));;(function($) {

	SidekickWP.Models.BucketContainer = Backbone.Model.extend({
		defaults: {
			navigation_history: ['buckets']
		},

		initialize: function(){
			this.view = new SidekickWP.Views.BucketContainer({model: this});
			return this;
		}
	});

}(jQuery));;(function($) {

	SidekickWP.Models.Bucket = Backbone.Model.extend({
		defaults: {
			full_library: null
		},

		initialize: function(){
			// console.log('initialize bucketModel %o', this.attributes);
			this.view = new SidekickWP.Views.Bucket({model: this});
			return this;
		}
	});

}(jQuery));;(function($) {

	SidekickWP.Helpers = ({
		preventScrolling: function(){
			$('div#sidekick .bucketContainer>div>ul').on('DOMMouseScroll mousewheel', function(ev) {
				console.log('asd');
				var $this = $(this),
				scrollTop = this.scrollTop,
				scrollHeight = this.scrollHeight,
				height = $this.height(),
				delta = (ev.type == 'DOMMouseScroll' ?
					ev.originalEvent.detail * -40 :
					ev.originalEvent.wheelDelta),
				up = delta > 0;

				var prevent = function() {
					ev.stopPropagation();
					ev.preventDefault();
					ev.returnValue = false;
					return false;
				};

				if (!up && -delta > scrollHeight - height - scrollTop) {
                    // Scrolling down, but this will take us past the bottom.
                    $this.scrollTop(scrollHeight);
                    return prevent();
                } else if (up && delta > scrollTop) {
					// Scrolling up, but this will take us past the top.
					$this.scrollTop(0);
					return prevent();
				}
			});
		}
	});
}(jQuery));

;(function($) {

	SidekickWP.Models.Message = Backbone.Model.extend({
		defaults: {
			title: null,
			message: null
		},

		initialize: function(){
			this.view = new SidekickWP.Views.Message({model: this, el: $("#sidekick ul.bucketContainer div")});
		}
	});

}(jQuery));;(function($) {

	SidekickWP.Models.Review = Backbone.Model.extend({
		defaults: {
			walkthrough_title: null
		},

		initialize: function(){
			this.view = new SidekickWP.Views.Review({model: this, el: $("#sidekick .bucketContainer div")});
		}
	});

}(jQuery));;(function($) {

	SidekickWP.Models.Tracking = Backbone.Model.extend({
		defaults : {
			gaAccountID : 'UA-39283622-1'
		},

		initialize: function(){
			SidekickWP.Events.on('track_open_sidekick_window', this.track_open_sidekick_window, this);
			SidekickWP.Events.on('track_explore', this.track_explore, this);
			SidekickWP.Events.on('window_activate', this.window_activate, this);
			SidekickWP.Events.on('window_deactivate', this.window_deactivate, this);
			SidekickWP.Events.on('track_error', this.track_error, this);

			window._gaq = window._gaq || [];
			window._gaq.push(['sidekickWP._setAccount', this.get('gaAccountID')]);

			(function() {
				var ga_sk = document.createElement('script'); ga_sk.type = 'text/javascript'; ga_sk.async = true;
				ga_sk.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
				var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga_sk, s);
			})();
		},

		send: function(data){
			if (typeof sk_config.tracking_off !== 'undefined' && sk_config.tracking_off === true) {
				console.log("Tracking is off!");
				return false;
			}

			model = window.sidekickWP || {};

			data        = data || {};
			data.source = 'plugin';
			data.action = 'track';
			data.config = sk_config;

			if (typeof sidekick !== 'undefined' && (typeof sk_config.track_data === 'undefined' || sk_config.track_data === true)) {
				data.user = sk_config.license_key;
			}

			var http = 'http';
			if (window.location.toString().indexOf('https') > -1) {
				http = 'https';
			}

			// console.log('WP: send tracking to WPU',data);
			$.post(http + "://library.sidekick.pro/wp-admin/admin-ajax.php", data);
		},

		track_explore: function(data){
			window._gaq.push(['sidekickWP._trackEvent', 'Plugin - Explore', data.what, null, 0,true]);
			this.send({type: 'explore', label: data.what, data: data.id});
		},

		track_open_sidekick_window: function(data){
			window._gaq.push(['sidekickWP._trackEvent', 'Plugin - Window', 'Open', null, 0,true]);
			this.send({type: 'open'});
		},

		window_activate: function(data){
			window._gaq.push(['sidekickWP._trackEvent', 'Plugin - Activate', '', sk_config.wpu_plugin_version, 0,true]);
			this.send({type: 'activate'});
		},

		window_deactivate: function(data){
			window._gaq.push(['sidekickWP._trackEvent', 'Plugin - Deactivate', '', sk_config.wpu_plugin_version, 0,true]);
			this.send({type: 'deactivate'});
		},

		track_error: function(data){
			window._gaq.push(['sidekickWP._trackEvent', 'Plugin', 'Error', data.msg,null,true]);
			this.send({type: 'error', label: data.msg});
		}

	});

}(jQuery));


;(function($) {

	SidekickWP.Models.User = Backbone.Model.extend({
		defaults: {
			view: null,
			http: 'http'
		},

		initialize: function(){
			if (window.location.toString().indexOf('https') > -1) {
				this.set('http','https');
			}
			this.view = new SidekickWP.Views.User({model: this, el: $("#sidekick ul.sk_bucketContainer div")});
		}
	});

}(jQuery));;(function($) {
	SidekickWP.Views.App = Backbone.View.extend({
		initialize: function(){
			SidekickWP.Events.on('toggle_sidekick_drawer', this.toggle_sidekick_drawer, this);
			SidekickWP.Events.on('close_sidekick_drawer',  this.close_sidekick_drawer, this);
			SidekickWP.Events.on('open_sidekick_drawer',   this.open_sidekick_drawer, this);
			SidekickWP.Events.on('resize_sidekick_drawer', this.resize_sidekick_drawer, this);
			SidekickWP.Events.on('toggle_hotspots',        this.toggle_hotspots, this);
			SidekickWP.Events.on('toggle_preferences',     this.toggle_preferences, this);
			SidekickWP.Events.on('window_resize',          this.check_sidebar_minifiy, this);
			SidekickWP.Events.on('size_drawer',            this.size_drawer, this);


			Sidekick.Events.on('track_play',				this.check_sidebar_minifiy, this);
			Sidekick.Events.on('track_play',				this.toggle_sidekick_drawer,'hide');
			Sidekick.Events.on('track_stop',				this.open_sidekick_drawer);

			Sidekick.Events.on('track_play',				this.remove_hotspots,this);
			Sidekick.Events.on('track_stop',				this.draw_hotspots,this);

			Sidekick.Events.on('nextStep',					this.update_debugger);

			return this.render();
		},

		render: function(){
			console.groupEnd('%crender: SidekickWP: appView %o', 'color:#8fa2ff', this);

			this.BucketContainer = new SidekickWP.Models.BucketContainer({
				full_library: this.model.get('full_library')
			});

			if (_.size(this.model.get('full_library').buckets) > 0) {
				BucketContainer = this.BucketContainer.view.render().$el.html();
			} else {
				BucketContainer = '<div class="warning"><div class="padding">Sorry but there is no walkthroughs found for ' + sk_config.main_soft_name + ' ' + sk_config.main_soft_version + '</div></div>';
				SidekickWP.Events.trigger('show_msg',{title: "No Walkthroughs", msg: "We're sorry but it looks like there are no walkthroughs compatible with your version of software."},this.model);
			}

			var template = _.template( SidekickWP.Templates.App, {
				sk_debug:        this.model.get('sk_debug'),
				BucketContainer: BucketContainer,
				paid_library:    this.model.get('paid_library'),
				hotspots:        $.cookie('sidekick_hotspots')
			});
			this.$el.append( template );

			if (!this.model.get('show_toggle_feedback'))
				$('#sk_taskbar #toggle_feedback').hide();

			SidekickWP.Events.trigger('rendered');
			Sidekick.Events.trigger('bind_controls');

			// this.toggle_sidekick_window();
			this.draw_hotspots();

			var currentDebugMode = $.cookie('sidekick_debug_mode');

			$(document).bind('keypress.sidekickwp',{context: this}, function(e){
				console.log('e %o', e);
				console.log('e.keyCode %o', e.keyCode);

				if ((e.keyCode == 68 || e.charCode == 68) && e.shiftKey === true) { // shift D
					var currentDebugMode = $.cookie('sidekick_debug_mode');

					if (currentDebugMode){
						console.log('DEBUG MODE ON');
						$('.sk_debug').hide();
						$.cookie('sidekick_debug_mode', 0, { expires: 0, path: '/' });
						$.cookie('sidekick_active_walkthrough_current_step_DEBUG', null, { expires: 0, path: '/' });
					} else {
						console.log('DEBUG MODE OFF');
						$('.sk_debug').show();
						$.cookie('sidekick_debug_mode', 1, { expires: 365, path: '/' });
					}
				}
			});

			$('.sk_debug input').bind('keyup.sidekickwp',{context: this}, function(e){
				if ($.isNumeric($('.sk_debug input').val())) {
					console.log('Saving Debug Step');
					$.cookie('sidekick_active_walkthrough_current_step_DEBUG', parseInt($('.sk_debug input').val(),10), { expires: 1, path: '/' });
				} else {
					console.log('Clearing Debug Step');
					$.cookie('sidekick_active_walkthrough_current_step_DEBUG', null, { expires: 0, path: '/' });
				}
			});

			if (currentDebugMode) {
				var activeStepDEBUG = $.cookie('sidekick_active_walkthrough_current_step_DEBUG');
				if (activeStepDEBUG) {
					$('.sk_debug input').val(activeStepDEBUG);
				}
				$('.sk_debug').show();
			}

			// if (sk_config.open_bucket) {
			// 	SidekickWP.Events.trigger('open_sidekick_drawer');
			// 	$('[data-open_bucket="' + sk_config.open_bucket + '"],[data-open_walkthroughs="' + sk_config.open_bucket + '"]').trigger('click');
			// }

			$(window).resize(_.debounce(function(){
				SidekickWP.Events.trigger('resize_sidekick_drawer');
			},500));

			$(window).resize(_.debounce(function(){
				SidekickWP.Events.trigger('window_resize');
			},500));

			console.groupEnd();
			return this;
		},

		events: {
			"click #logo,.sk_toggle":    "toggle_sidekick_window",
			"click #toggle_drawer":      "toggle_sidekick_drawer",
			"click #toggle_hotspots":    "toggle_hotspots",
			"click #toggle_preferences": "toggle_preferences",
			"click #toggle_feedback":    "show_feedback",
			"click #close_sidekick":     "close_sidekick_window",
			"click #sk_upgrade button":  "screen_activate"
		},

		update_debugger: function(){

			$('#sidekick .step_count').html('Current Step: ' + sidekick.walkthroughModel.get('currentStep') + '/' + _.size(sidekick.walkthroughModel.get('steps')));
		},

		screen_activate: function(){
			SidekickWP.Events.trigger('screen_activate');
		},

		check_sidebar_minifiy: function(){
			var width = $( document ).width();
			var playing = $('#sidekick').hasClass('playing');
			if (width < 784 && playing) {
				$('.sidekick_stop').trigger('click');
				Sidekick.Events.trigger('show_modal',{error_id:1,msg: 'Sidekick requires a larger window to run properly.'});
			}

			if ('body.sticky-menu') {
				$('body').removeClass('sticky-menu');
				$('body').removeClass('auto-fold');
				// $('li#collapse-menu').trigger('click');
			}
		},

		goto_config: function(){
			// console.log('goto_config');
			window.open(sk_config.plugin_url,'_self');
		},

		show_feedback: function(){
			// console.log('show_feedback');
			Sidekick.Events.trigger('show_modal',{title:'Feedback',message: 'Send us some feedback!',primary_button_message: 'Send',secondary_button_message:'Cancel',email:sk_config.user_email});
		},

		resize_sidekick_drawer: function(){
			// console.log('resize_sidekick_drawer %o', $('#sk_drawer').height());
			// console.log('$(#sidekick).hasClass(open) %o', $('div#sidekick').hasClass('open'));

			if ($('div#sidekick').hasClass('open')) {
				if ($('#sk_drawer').height() > 0) {
					SidekickWP.Events.trigger('size_drawer');
				}
			} else {
				$('#sk_drawer').height(0);
			}
		},

		toggle_preferences: function(){
			window.open(sk_config.plugin_url,'_self');
		},

		toggle_sidekick_drawer: function(force){
			// console.log('toggle_sidekick_drawer %o | %o | %o', force,$('#sk_drawer').height(),$('div#sidekick').hasClass('open'));

			if ($('#sk_drawer').height() > 0 || force == 'hide' || !$('div#sidekick').hasClass('open')) {
				// $('.sk_hotspot').hide();
				SidekickWP.Events.trigger('close_sidekick_drawer');
			} else {
				SidekickWP.Events.trigger('open_sidekick_drawer');
			}
		},

		close_sidekick_drawer: function(){
			console.log('Closing Drawer');
			$('div#sidekick').addClass('drawer_closed').removeClass('drawer_open');
			$('div#sidekick #toggle_drawer').removeClass('on');
			$('#sk_drawer .sk_bucketContainer,#sk_drawer').css({
				height: 0,
				transition: 'height 0.3s ease-in-out'
			});
		},

		open_sidekick_drawer: function(){
			console.log('Open Drawer');

			$('div#sidekick').addClass('drawer_open').removeClass('drawer_closed');
			$('.sk_hotspot').show();
			SidekickWP.Events.trigger('size_drawer');
		},

		size_drawer: function(){
			var window_height = $(window).height();
			var sk_drawer_height          = window_height - 80;
			var sk_bucketContainer_height = sk_drawer_height - 56;
			if ($('#sk_upgrade').length > 0) {
				sk_bucketContainer_height -= $('#sk_upgrade').height();
			}
			var sub_bucket_height         = window_height - 137;
			var sub_bucket_inner_height   = sub_bucket_height - $('#sk_upgrade').height() - 58;

			$('div#sidekick').addClass('open');
			$('div#sidekick .sk_caption').removeClass('show');
			$('div#sidekick #toggle_drawer').addClass('on');
			$('#sk_drawer').css({
				height: sk_drawer_height,
				transition: 'height 0.3s ease-in-out'
			});
			$('#sk_drawer .sk_bucketContainer').css({
				height: sk_bucketContainer_height,
				transition: 'height 0.3s ease-in-out'
			});
			$('#sk_drawer .sub_bucket').css({
				maxHeight: sub_bucket_height,
				transition: 'all 0.3s ease-in-out'
			});
			$('#sk_drawer .sub_bucket_inner').css({
				height: sub_bucket_inner_height
			});
		},

		toggle_sidekick_window: function(e){
			console.log('toggle_sidekick_window');

			if ($('div#sidekick').hasClass('open')) {
				// console.log('Closing Sidekick Window');
				SidekickWP.Events.trigger('close_sidekick_drawer');
				$('div#sidekick').wait(500).removeClass('open');
			} else {
				SidekickWP.Events.trigger('track_explore',{what:'Sidekick - Open'});
				// console.log('Showing Sidekick Window');
				$('div#sidekick').addClass('open').wait(500,function(e){
					SidekickWP.Events.trigger('open_sidekick_drawer');
				});
			}
		},

		close_sidekick_window: function(e){
			// console.log('close_sidekick_window');
			if ($('div#sidekick').hasClass('open')) {
				SidekickWP.Events.trigger('toggle_sidekick_drawer');
				$('div#sidekick').wait(500).removeClass('open');
			}
		},

		toggle_hotspots: function(){
			console.log('toggle_hotspots');
			if ($('#toggle_hotspots').hasClass('on')) {
				// console.log('Turning off hotspots');
				$('#toggle_hotspots').removeClass('on');
				$.cookie('sidekick_hotspots', 0, { expires: 365, path: '/' });
				$('.sk_hotspot').parent().remove();
			} else {
				// console.log('Turning on hotspots');
				$('#toggle_hotspots').addClass('on');
				$.cookie('sidekick_hotspots', 1, { expires: 365, path: '/' });
				this.draw_hotspots();
			}
		},

		remove_hotspots: function(){
			// console.log('remove_hotspots');

			this.unbind_hotspot_targets();
			$('.sk_hotspot').parent().remove();
		},

		unbind_hotspot_targets: function(){
			// console.log('unbind_hotspot_targets');
			var hotspots = this.model.get('library_filtered_hotspots');
			var url = window.location.toString();

			for(var hotspot in hotspots){
				hotspot_data = hotspots[hotspot];

				if (url.indexOf(hotspot_data.url) > -1) {
					selectors = hotspot_data.selector;
					$(selectors).off('css-change');
				}
			}
		},

		draw_hotspots: function(){
			var hotspots = this.model.get('library_filtered_hotspots');
			console.groupCollapsed('Attaching Hotspots [%o]',hotspots.length);

			var url           = window.location.toString();
			var show_hotspots = $.cookie('sidekick_hotspots');
			var count         = 0;
			var hotspot_data;
			var hotspot;
			var selectors;

			console.log('show_hotspots %o', show_hotspots);
			console.log('show_hotspots === true %o', show_hotspots === true);

			// Counting Hotspots
			for(hotspot in hotspots){
				hotspot_data = hotspots[hotspot];

				if (url.indexOf(hotspot_data.url) > -1) {
					selectors = hotspot_data.selector;

					if ($(selectors).length == 1 && $(selectors).is(':visible')) {
						console.log('hotspot selectors-1 %o', selectors);
						count++;
					} else if ($(selectors).length > 1){
						_.each($(selectors),function(item,key){
							if ($(item).length && $(item).is(':visible')) {
								console.log('hotspot selectors-2 %o', item);
								count++;
							}
						});
					}
				}
			}

			if (count > 0) {
				$('div#sidekick #toggle_hotspots').html(count).show();
			} else {
				$('div#sidekick #toggle_hotspots').html(count).hide();
			}

			if (show_hotspots === '1' || typeof show_hotspots === 'undefined') { // User unspecified default is on

				for(hotspot in hotspots){

					var selector_x        = 'left';
					var selector_y        = 'top';
					var hotspot_x         = 'right';
					var hotspot_y         = 'top';
					var hotspot_y_padding = '+0';
					var hotspot_x_padding = '+0';

					hotspot_data = hotspots[hotspot];

					if (url.indexOf(hotspot_data.url) > -1) {
						selectors = hotspot_data.selector;
						if ($(selectors).length == 1) {

							var offset = $(selectors).offset();

							// selectors = '.add-new-h2';
							$('body').append('<a href="javascript: sidekick.play(' + hotspot_data.id + ')"><div class="sk_hotspot sk_hotspot_' + hotspot + '" data-target="' + selectors + '"></div></a>');

							console.log('%cAttaching Single Hotspot %o[%O] -> (%o [%O])','color: #64c541','sk_hotspot_' + hotspot,$('.sk_hotspot_' + hotspot), selectors,$(selectors));

							console.log('at: selector_x + " " + selector_y %o', selector_x + " " + selector_y);
							console.log('my: hotspot_x + hotspot_x_padding + " " + hotspot_y + hotspot_y_padding %o', hotspot_x + hotspot_x_padding + " " + hotspot_y + hotspot_y_padding);

							$('.sk_hotspot_' + hotspot).position({
								at:        selector_x + " " + selector_y,
								my:        hotspot_x + hotspot_x_padding + " " + hotspot_y + hotspot_y_padding,
								of:        $(selectors)
							}).css({zIndex: $(selectors).css('zIndex')});

							$(selectors).data('sk_hotspot','.sk_hotspot_' + hotspot);

							$(selectors).csswatch({
								props: 'top,left',
								props_functions: {"top":"offset().top", "left":"offset().left"}
							});

							console.log('selectors %o', selectors);


							$(selectors).on("css-change", function(event, change){
								console.log('css-change',arguments);
								console.log('this %o', this);

								var selector_x        = 'left';
								var selector_y        = 'top';
								var hotspot_x         = 'right';
								var hotspot_y         = 'top';
								var hotspot_y_padding = '+0';
								var hotspot_x_padding = '+0';


								$($(this).data('sk_hotspot')).position({
									at:        selector_x + " " + selector_y,
									my:        hotspot_x + hotspot_x_padding + " " + hotspot_y + hotspot_y_padding,
									of:        this
								});
							});

							$('.sk_hotspot').wait(20*count).addClass('visible');
						} else if ($(selectors).length > 1){
							console.log('selectors %o', selectors);

							_.each($(selectors),function(item,key){
								$('body').append('<a href="javascript: sidekick.play(' + hotspot_data.id + ')"><div class="sk_hotspot sk_hotspot_' + hotspot + '_' + key + '" data-target="' + item + '"></div></a>');
								// console.log('%cAttaching Hotspot #o %o (%o)','color: #64c541',key,'sk_hotspot_' + hotspot + '_' + key, $('.sk_hotspot_' + hotspot + '_' + key));

								$('.sk_hotspot_' + hotspot + '_' + key).position({
									at:        selector_x + " " + selector_y,
									my:        hotspot_x + hotspot_x_padding + " " + hotspot_y + hotspot_y_padding,
									of:        item
								}).css({zIndex: $(item).css('zIndex')});

								$('.sk_hotspot').wait(20*count).addClass('visible');
							});
						} else {
							console.log("%cCouldn't attach a hotspot to selector (" + selectors + ")",'color: red');
							// Sidekick.Events.trigger('track_error',{model: this, msg: msg});
							// console.error(msg + ' %o',hotspot_data);
						}
					}
				}
			};
			console.groupEnd();
		}
	});

}(jQuery));



;(function($) {
	SidekickWP.Views.BucketContainer = Backbone.View.extend({

		initialize: function(models,options){
			SidekickWP.Events.on('rendered', this.setup_events, this);
			return this;
		},

		render: function(){
			// console.group('%crender: render: bucketContainerView %o', 'color:#8fa2ff', this);

			this.bucket = new SidekickWP.Models.Bucket({
				title:        this.model.get('title'),
				full_library: this.model.get('full_library')
			});
			this.$el.append(this.bucket.view.render().el);
			// console.groupEnd();
			return this;
		},

		clicked_bucket: function(e){
			// console.log('clicked_bucket',e);


			var navigation_history = this.model.get('navigation_history');
			$('#sk_drawer>h2 span').html('Walkthroughs');

			if ($(e).hasClass('goprev')) {
				// console.log('Go Back');
				$('.show').removeClass('show').wait(2000).parent().remove();
				navigation_history.pop();
				var goto_bucket = navigation_history[navigation_history.length-1];
				if (goto_bucket == 'buckets') {
					$('[data-bucket_id="' + goto_bucket + '"]').removeClass('hide').addClass('show');
				} else {
					$('ul.sub_bucket[data-bucket_id="' + goto_bucket + '"]').removeClass('hide').addClass('show');
				}

			} else if ($(e).data('open_bucket')){
				// console.log('Showing Bucket %o',$(e).data('open_bucket'));
				// console.log('$(e).closest(.show) %o', $(e).closest('.show'));

				SidekickWP.Events.trigger('track_explore',{what:'Bucket - ' + $('span',e).html(), id: $(e).data('open_bucket') });

				$(e).closest('.show').removeClass('show').addClass('hide');


				this.draw_bucket($(e).data('open_bucket'));


				SidekickWP.Events.trigger('resize_sidekick_drawer');


				$('ul.sub_bucket[data-bucket_id="' + $(e).data('open_bucket') + '"]').wait(10).addClass('show');

				navigation_history.push($(e).data('open_bucket'));
			} else {
				// console.log('Showing Walkthroughs %o',$(e).data('open_walkthroughs'));
				// console.log('$(e).parent() %o', $(e).parent());

				SidekickWP.Events.trigger('track_explore',{what:'Bucket - ' + $('span',e).html(), id: $(e).data('open_walkthroughs') });

				$('#sk_drawer>h2 span').html('How Do I...');

				$(e).closest('.show').removeClass('show').addClass('hide');

				this.draw_walkthroughs($(e).data('open_walkthroughs'));
				$('ul.walkthrough[data-bucket_id="' + $(e).data('open_walkthroughs') + '"]').wait(10).addClass('show');

				navigation_history.push($(e).data('open_bucket'));
			}
			this.setup_events();
			this.model.set('navigation_history',navigation_history);
		},

		find_bucket_by_id: function(data,key,match){
			if (data[key] == match) {
				// console.log('%cfound %o','color: green',data);
				return data;
			}

			if (_.size(data.sub_buckets) > 0 ) {
				for (var sub_bucket in data.sub_buckets){
					var found = this.find_bucket_by_id(data.sub_buckets[sub_bucket],key,match);
					if (found) {
						return found;
					}
				}
			} else {
				// console.log('%cnot found','color: red');
				return;
			}
		},

		find_bucket_by_id_rec: function(data,key,match){
			for (var sub_bucket in data){
				var result = this.find_bucket_by_id(data[sub_bucket],key,match);
				if (result) {
					return result;
				}
			}
			return false;
		},

		draw_bucket: function(bucket_id){
			// console.info('draw_bucket %o', bucket_id);
			var full_library = this.model.get('full_library');
			var bucket_data  = this.find_bucket_by_id_rec(full_library.buckets,'id',bucket_id);

			var variables = {
				bucket_id:                                   bucket_id,
				bucket_title:                                bucket_data.post_title,
				bucket_data:                                 bucket_data,
				full_library:                                full_library
			};

			var template = _.template( SidekickWP.Templates.SubBucket, variables );

			// console.log('draw_bucket variables %o', variables);
			// console.log('template %o', template);

			$('.sk_bucketContainer>div').append(template);
		},

		draw_walkthroughs: function(bucket_id){
			// console.log('draw_walkthroughs %o', bucket_id);

			var full_library = this.model.get('full_library');
			var bucket_data = this.find_bucket_by_id_rec(full_library.buckets,'id',bucket_id);

			var variables = {
				bucket_id:    bucket_id,
				bucket_data:  bucket_data,
				full_library: full_library
			};

			var template = _.template( SidekickWP.Templates.Walkthroughs, variables );
			// console.log('template %o', template);

			$('.sk_bucketContainer>div').append(template);
		},

		setup_events: function(){
			$('.heading').unbind('click').click({context:this},function(e){
				e.data.context.clicked_bucket(this);
			});

			$('a.sidekick_play_walkthrough').unbind('click').click({context:this},function(e){
				SidekickWP.Events.trigger('close_sidekick_window');
			});
			// SidekickWP.Helpers.preventScrolling();
		}
	});

}(jQuery));

;(function($) {
	SidekickWP.Views.Bucket = Backbone.View.extend({

		initialize: function(models,options){
			return this;
		},

		render: function(){
			// console.group('%crender: render: bucketView %o', 'color:#8fa2ff', this);

			var variables = {
				full_library: this.model.get('full_library')
			};

			console.log('SidekickWP.Templates.Bucket variables %o', variables);

			var template = _.template( SidekickWP.Templates.Bucket, variables );
			this.$el.append(template);
			// console.groupEnd();
			return this;
		}
	});

}(jQuery));;(function($) {
	SidekickWP.Views.Message = Backbone.View.extend({

		initialize: function(models,options){
			console.group('%crender: render: messageView %o', 'color:#8fa2ff', this);
			this.render();
			console.groupEnd();
			return this;
		},

		render: function(){

			var variables = {
				title:   this.model.get('title'),
				message: this.model.get('message')
			};

			var template = _.template( SidekickWP.Templates.Message, variables );

			this.$el.append( template );
			// SidekickWP.Helpers.preventScrolling();
			// SidekickWP.Events.trigger('show_next_pane');

			// $('div#sidekick .prev_window').removeClass('prev_window');
			// $('div#sidekick #main_menu').addClass('prev_window');
			// $('div#sidekick ul.main>li').not('#main_menu,#review').remove();

			return this;
		}

	});

}(jQuery));;(function($) {
	SidekickWP.Views.Review = Backbone.View.extend({

		initialize: function(models,options){
			console.group('%cinitialize: Core View %o', 'color:#3b4580', arguments);
			this.render();
			this.setup_events();
			console.groupEnd();
			return this;
		},

		render: function(){
			console.group('%crender: render: renderView %o', 'color:#8fa2ff', this);
			console.log('SidekickWP.Templates.Review %o', SidekickWP.Templates.Review);

			var variables = {
				title:   'How did we do?'
			};

			var template = _.template( SidekickWP.Templates.Review, variables );
			console.log('template %o', template);

			this.$el.append( template );
			// SidekickWP.Helpers.preventScrolling();
			// SidekickWP.Events.trigger('show_next_pane');

			// $('div#sidekick .prev_window').removeClass('prev_window');
			// $('div#sidekick #main_menu').addClass('prev_window');
			// $('div#sidekick ul.main>li').not('#main_menu,#review').remove();

			return this;
		},

		events: {
			"click input[type='submit']": "submit",
			"click div.rate span": "rate"
		},

		setup_events: function(){
			var group_id = this.model.get('id');

			$('div#sidekick .review h2 button.goback, #sidekick .review input[type="button"]').unbind('click').click({context:this},function(e){
				console.log('click goback/button');
				SidekickWP.Events.trigger('show_main_pane');
			});

			$('div#sidekick .review .rate span').unbind('hover').hover(function(){
				$(this).addClass('hover')
				.prevAll().addClass('hover');
			},function(){
				$('div#sidekick .review .rate span').removeClass('hover');
			});

			$('div#sidekick .review .rate span').unbind('click').click = this.rate;

			$('div#sidekick .review textarea').unbind('click').click(function(){
				if(!$(this).hasClass('clicked')){
					$(this).addClass('clicked')
					.val('');
				}
			});
		},

		submit: function(){
			var data = {
				walkthrough_title: this.model.get('walkthrough_title'),
				value:             $('div#sidekick textarea[name="comment"]').val(),
				license:           sk_config.license_key
			};

			var http = 'http';
			if (window.location.toString().indexOf('https') > -1) {
				http = 'https';
			}

			$.ajax({
				url:      http + '://library.sidekick.pro/wp-admin/admin-ajax.php?action=wpu_add_comment',
				context:  this,
				data:     data,
				dataType: 'json'
			}).done(function(data,e){
				console.log('Saved Comment');
				$('div#sidekick textarea').html('Thank You!');
				$('div#sidekick .review input[type="submit"]').val('Sent!');
				setTimeout(SidekickWP.Events.trigger('show_main_pane'),3000);
			}).error(function(e){
				console.error('Comment Save error (%o)',e);
			});
		},

		rate: function(e){
			var data = {
				walkthrough_title: this.model.get('walkthrough_title'),
				rating:            $(e.currentTarget).data('val'),
				license:           sk_config.license_key
			};

			$(e.currentTarget).addClass('saved')
			.prevAll().addClass('saved');

			$('div#sidekick .rate span').unbind('mouseenter mouseleave click').css({cursor: 'default'});

			var http = 'http';
			if (window.location.toString().indexOf('https') > -1) {
				http = 'https';
			}

			$.ajax({
				url:      http + '://library.sidekick.pro/wp-admin/admin-ajax.php?action=wpu_add_rating',
				context:  this,
				data:     data,
				dataType: 'json'
			}).done(function(data,e){
				console.log('Saved Rating');
				$('div#sidekick .hover').addClass('saved');

			}).error(function(e){
				console.error('Rating Save error (%o)',e);
			});

		}

	});

}(jQuery));;_.templateSettings.interpolate = /\{\{(.*?)\}\}/;

SidekickWP.Templates.App = [
	"<div id='sidekick' class='sidekick_player'>",
		"<div id='sk_taskbar'>",
			"<div id='logo'></div>",
			"<button class='sk_toggle'></button>",
			"<div class='sk_controls'>",
				"<button class='sidekick_restart'></button>",
				"<button class='sidekick_play_pause'></button>",
				"<button class='sidekick_stop'></button>",
			"</div>",
			"<div class='sk_debug'>",
				"<div class='step_count'></div>",
				"<input type='text' name='step' placeholder='Force Step'></input>",
				"<div class=''>Skip Step <br/>Press ></div>",
			"</div>",
			"<div class='sk_toggles'>",
				// "<% console.log('hotspots %o',hotspots);%>",
				"<button id='toggle_hotspots' <% if (hotspots === '1' || typeof hotspots === 'undefined'){%>class='on'<% } %> alt='Number of hotspots'>0</button>",
				"<button id='toggle_feedback'></button>",
				"<button id='toggle_preferences'></button>",
				"<button id='toggle_drawer'><i></i></button>",
			"</div>",
			"<div class='sk_info'>",
				"<div class='sk_title'><label>Now Playing</label><span class='sk_walkthrough_title'></span></div>",
				"<div class='sk_time'>0:00/0:00</div>",
			"</div>",
			"<div class='sk_caption'>",
				"<div class='text'></div>",
			"</div>",
		"</div>",
		"<div id='sk_drawer'>",
			"<h2><span>Walkthroughs</span><button id='close_sidekick'></button></h2>",
			"<ul class='sk_bucketContainer'>",
				"<% print(BucketContainer) %>",
				"<% if(typeof paid_library === 'undefined' || paid_library == null || _.size(paid_library.buckets) == 0){ %>",
					"<ul id='sk_upgrade'><li><button>Upgrade SIDEKICK!</button></li></ul>",
				"<% } %>",
			"</ul>",
		"</div>",
	"</div>"
].join("");

SidekickWP.Templates.Bucket = [
	"<ul class='buckets' data-bucket_id='buckets'>",
		"<% _.each(full_library.buckets, function(bucket_data, bucket_title){ %>",
			"<li class='heading bucket_heading' <% if (bucket_data.sub_buckets){ %> data-open_bucket='<% print(bucket_data.id) %>' <% } else { %> data-open_walkthroughs='<% print(bucket_data.id) %>' <% } %> ><span><% print(bucket_title) %></span><i></i></li>",
		"<% }); %>",
	"</ul>"
].join("");

SidekickWP.Templates.SubBucket = [
	"<ul class='sub_buckets'>",
		"<ul class='sub_bucket' data-bucket_id='<% print(bucket_id) %>'>",
			"<li class='heading goprev'><span><% print(bucket_title) %></span><i></i></li>",
			"<ul class='sub_bucket_inner'>",
				"<% for (sub_bucket_data in bucket_data.sub_buckets){ %>",
					"<% sub_bucket_data = bucket_data.sub_buckets[sub_bucket_data] %>",
					"<% if (_.size(sub_bucket_data.sub_buckets) > 0){ %>",
						"<li class='heading sub_bucket_heading' data-open_bucket='<% print(sub_bucket_data.id) %>'><span><% print(sub_bucket_data.post_title) %></span><i></i></li>",
					"<% } else { %>",
						"<li class='heading sub_bucket_heading' data-open_walkthroughs='<% print(sub_bucket_data.id) %>' ><span><% print(sub_bucket_data.post_title) %></span><i></i></li>",
					"<% } %>",
				"<% }; %>",
			"</ul>",
		"</ul>",
	"</ul>"
].join("");

SidekickWP.Templates.User = [
	"<% if (view == 'login') { %>",
		"<ul class='user login'>",
			"<li class='heading goprev'><span>Account</span><i></i></li>",
			"<li>",
				"<form id='login' action='<% print(http) %>://library.sidekick.pro/api/user/' method='GET'>",
					"<div>",
						"<label>E-Mail</label><input type='text' name='user_email'/>",
						"<label>Password</label><input type='password' name='password'/>",
						"<a target='_blank' href='/wp-login.php?action=lostpassword'>Forgot Password</a>",
						"<div id='buttons'>",
							"<input type='submit' value='Login'/>",
							"<input type='button' value='Register'/>",
						"</div>",
					"</div>",
				"</form>",
			"</li>",
		"</ul>",
	"<% } else if(view == 'activate') { %>",
		"<ul class='user activate'>",
			"<li class='heading goprev'><span>Activate</span><i></i></li>",
			"<li>",
				// "<form action='<% print(http) %>://library.sidekick.pro/api/user/' method='POST'>",
					"<div id='content'>",
						"<div class='padder'>",
							"<h3>SIDEKICK premium get's you all core walkthroughs</h3>",
							"<a href='<% print(http) %>://www.sidekick.pro/wordpress/modules/wordpress-core-module-premium/' target='_blank'><button>BUY<span>$10 Per Month</span></button></a>",
							// "<div>OR</div>",
							"<br/><label>Enter Activation ID</label><input placeholder='<% print(activation_id) %>' type='text' name='activation_id'/>",
							"<div id='buttons'>",
								"<input type='submit' name='Activate' value='Activate' />",
								"<input type='button' name='Cancel' value='Cancel' />",
							"</div>",
						"</div>",
						"<div id='benefits'>",
							"<h3>Benefits of premium</h3>",
							"<ul>",
								"<li id='more'>",
									"<h4>More Walkthroughs</h4><p>Get our full WordPress Core library of over 150 walkthroughs.</p>",
								"</li>",
								"<li id='types'>",
									"<h4>Hotspots & Overviews</h4><p>Gain in depth knowledge and quick hints.</p>",
								"</li>",
							"</ul>",
						"</div>",
					"</div>",
				// "</form>",
			"</li>",
		"</ul>",
	"<% } else if(view == 'register') { %>",
		"<ul class='user register'>",
			"<li class='heading goprev'><span>Register</span><i></i></li>",
			"<li>",
				"<form action='<% print(http) %>://library.sidekick.pro/api/user/' method='POST'>",
					"<label>First Name</label><input type='text' name='first_name'/>",
					"<label>E-Mail</label><input type='text' name='user_email'/>",
					"<label>Password</label><input type='password' name='password'/>",
					"<label>Confirm Password</label><input type='password' name='password2'/>",
					"<label>Coupon</label><input type='text' name='coupon'/>",
					"<input type='button' name='Cancel'/>",
					"<input type='submit' name='Register'/>",
				"</form>",
			"</li>",
		"</ul>",
	"<% } else if(view == 'profile') { %>",
		"<ul class='user profile'>",
			"<li class='heading goprev'><span>Profile</span><i></i></li>",
			"<li>",
				"<form action=''>",
					"<label>Coupon</label><input type='text' name='coupon'/>",
					"<input type='button' name='Cancel'/>",
					"<input type='submit' name='Register'/>",
				"</form>",
			"</li>",
		"</ul>",
	"<% } %>"
].join("");

SidekickWP.Templates.Walkthroughs = [
	"<ul class='walkthroughs'>",
		"<ul class='walkthrough' data-bucket_id='<% print(bucket_id) %>'>",
			"<li class='heading goprev'><span><% print(bucket_data.post_title) %></span><i></i></li>",
			"<ul class='walkthroughs_inner' data-bucket_id='<% print(bucket_id) %>'>",
				"<% console.log('bucket_data %',bucket_data); %>",
				"<% var first_drawn = false; %>",
				"<% _.each(bucket_data.walkthroughs, function(walkthrough, walkthrough_key){ %>",
					"<% if (walkthrough.type == 'overview'){ %>",
						"<% if (!first_drawn){ %>",
							"<% if (_.size(bucket_data.walkthroughs) > 1){ %>",
								"<li class='sub_heading'><span>Overviews</span></li>",
							"<% } else{ %>",
								"<li class='sub_heading'><span>Overview</span></li>",
							"<% } %>",
							"<% first_drawn = true %>",
						"<% } %>",
						"<a href='javascript: sidekick.play(<% print(walkthrough.id) %>)'><li class='overview'><% print(walkthrough.title) %></li></a>",
					"<% } %>",
				"<% }); %>",
				"<% var first_drawn = false; %>",
				"<% _.each(bucket_data.walkthroughs, function(walkthrough, walkthrough_key){ %>",
					"<% if (walkthrough.type == 'how'){ %>",
						"<% if (!first_drawn){ %>",
							"<% if (_.size(bucket_data.walkthroughs) > 1){ %>",
								"<li class='sub_heading'><span>How-Tos</span></li>",
							"<% } else{ %>",
								"<li class='sub_heading'><span>How-To</span></li>",
							"<% } %>",
							"<% first_drawn = true %>",
						"<% } %>",
						"<a href='javascript: sidekick.play(<% print(walkthrough.id) %>)'><li class='how'><% print(walkthrough.title) %></li></a>",
					"<% } %>",
				"<% }); %>",
			"</ul>",
		"</ul>",
	"</ul>"
].join("");

SidekickWP.Templates.Review = [
	"<ul class='new_window review' data-title='<% print(title) %>'>",
		"<li>",
			"<div><div class='rate'><span data-val='1' class='rate1'></span><span data-val='2' class='rate2'></span><span data-val='3' class='rate3'></span><span data-val='4' class='rate4'></span><span data-val='5' class='rate5'></span></div>",
			"<textarea name='comment'>Let us know if you found the Walkthrough helpful or if we can improve something.</textarea>",
			"<br/><input type='button' value='Skip'></input><input type='submit' value='Submit'></input>",
		"</li>",
	"</ul>"
].join("");


SidekickWP.Templates.Message = [
	"<ul class='new_window message' data-title='<% print(title) %>'>",
		"<li>",
			"<div><% print(message) %></div>",
		"</li>",
	"</ul>"
].join("");

;(function($) {
	SidekickWP.Views.User = Backbone.View.extend({

		initialize: function(models,options){
			console.group('%cinitialize: User View %o', 'color:#3b4580', arguments);
			this.render();
			this.setup_events();
			console.groupEnd();
			return this;
		},

		render: function(){
			console.group('%crender: User View %o', 'color:#8fa2ff', this);

			var template = _.template( SidekickWP.Templates.User, this.model.attributes );
			console.log('this.$el %o', this.$el);
			console.log('template %o', template);

			$('> *',this.$el).addClass('hide');

			this.$el.append( template );
			return this;
		},

		events: {
		},

		close_profile: function(){
			$('ul.sk_bucketContainer ul.user').addClass('hide').wait(1000).remove();
			$('ul.sk_bucketContainer ul.buckets').removeClass('hide');
		},

		setup_events: function(){
			// this.setup_login();

			$('.heading',$('ul.sk_bucketContainer ul.user')).unbind('click').click({context:this},function(e){
				e.data.context.close_profile(this);
			});

			$('#sidekick ul.activate input[name="Cancel"]').unbind('click').click({context:this},function(e){
				console.log('click');
				e.data.context.close_profile(this);
			});

			$('#sidekick ul.activate input[type="submit"]').click(function(){
				var input = $('ul.activate input[name="activation_id"]');

				if ($(input).val() === '') {
					$(input).addClass('error');
				} else {
					$.post(ajaxurl, {action: 'sk_activate', activation_id: $(input).val()}, function(e){
						console.log('%cBack %o','background-color: yellow; color: black;',e);
						if (e.error == 404) {
							$(input).addClass('error').val("Activation ID Not Valid");
						} else if (e.success) {
							$(input).addClass('success').val("Successful... loading...");
							location.reload();
						}
					},'json');
				}
			});
		}

		// setup_login: function(){
		// 	$('#sidekick .login form').data('view',this);
		// 	$('#sidekick .login form').submit(function(e){
		// 		e.preventDefault();

		// 		var request = $.ajax({
		// 			// url: "http://library.sidekick.pro/api/login/",
		// 			url: "http://local.library.sidekick.pro/api/login/",
		// 			data: {
		// 				'user_email' : $('#sidekick .login form input[name="user_email"]').val(),
		// 				'password' : $('#sidekick .login form input[name="password"]').val()
		// 			},
		// 			dataType: "jsonp",
		// 			context: { view: $(this).data('view')}
		// 		},this).done(function(e){
		// 			this.view.login_callback(e,this.view);
		// 		});
		// 	});
		// },

		// login_callback: function(result,view){
		// 	console.log('%clogin_callback','color: white;background-color: green');
		// 	console.log('result %o', result);
		// 	if (result.token) {
		// 		$.cookie('sk_token', result.token);
		// 		new SidekickWP.Models.User({
		// 			'view' : 'activate'
		// 		});
		// 	}
		// }
	});
}(jQuery));;
jQuery(document).ready(function($) {
	window.sidekickWP = new SidekickWP.Models.App({
		show_toggle_feedback: true
	});
	// console.log('window.sidekickWP %o', window.sidekickWP);
	// jQuery('#logo').trigger('click');
});
