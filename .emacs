(setq-default indent-tabs-mode nil)

(add-to-list 'load-path "~/.emacs.d/js-comint")
(require 'js-comint)

(add-to-list 'load-path "~/.emacs.d/ethan-wspace/lisp")
(require 'ethan-wspace)
(global-ethan-wspace-mode 1)
