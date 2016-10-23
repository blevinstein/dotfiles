; check emacs version
(eval-when-compile (require 'cl-lib))
(cl-assert (<= 24 emacs-major-version))

(setq-default indent-tabs-mode nil)
(global-linum-mode t)

(add-to-list 'load-path "~/.emacs.d/ethan-wspace/lisp")
(require 'ethan-wspace)
(global-ethan-wspace-mode 1)

(add-to-list 'load-path "~/.emacs.d/smooth-scrolling")
(require 'smooth-scrolling)

; Javascript
(add-to-list 'load-path "~/.emacs.d/js-comint")
(require 'js-comint)
