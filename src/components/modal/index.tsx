import React, { Component, PropsWithChildren, ReactNode, createRef } from 'react';
import ReactDOM from 'react-dom';
import './style.scss';
import { Observable } from 'rxjs';
import { CSSTransition } from 'react-transition-group';

interface Footer {
  text: string;
  callback?: (val?: any) => void;
}
interface Props extends PropsWithChildren<any>{
  header?: string | ReactNode;
  content?: string | ReactNode;
  footer?: Footer[];
  maskClick?: (e: any) => void;
}
const defaultProps: Props = {
  header: '提示',
  footer: []
};

export class Modal extends Component<Props, any> {
  static defaultProps: Props = defaultProps;
  readonly state = {
    show: false
  };

  preventClick(e: any) {
    e.preventDefault();
    e.stopPropagation();
  }
  show() {
    this.setState({ show: true });
  }
  hide() {
    this.setState({ show: false });
  }

  render() {
    const { header, content, footer, maskClick } = this.props;
    const { show } = this.state;
    return (
      <CSSTransition
        in={show}
        classNames={{
          enter: 'modal-enter',
          enterActive: 'modal-enter-active',
          exit: 'modal-exit',
          exitActive: 'modal-exit-active',
          exitDone: 'modal-exit-done'
        }}
        timeout={300}
      >
        <div className={'windy-modal-wrapper'} onClick={maskClick}>
          <div className={'modal'} onClick={this.preventClick.bind(this)}>
            <div className={'modal-header'}>{ header }</div>
            <div className={'modal-content'}>{ content }</div>
            <div className={'modal-footer'}>
              {
                footer?.map((item, key) =>(
                  <button key={key} className={'button'} onClick={item.callback}>{item.text}</button>
                ))
              }
            </div>
          </div>
        </div>
      </CSSTransition>
    );
  }
}

export class ModalService {
  ele: Element[] = [];

  create(
    options: { title: string; content: string | ReactNode; footer: Footer[]; },
    callback?: (result?: any) => void
  ): { close(): void; } {
    const { title, content, footer } = options;
    const container = document.createElement('div');
    container.className = 'modal-container';
    document.body.appendChild(container);
    const instance = createRef<Modal>();
    ReactDOM.render(
      <Modal
        ref={instance}
        header={ title }
        content={ content }
        maskClick={ callback }
        footer={ footer }
      />,
      container
    );
    this.ele.push(container);
    instance.current?.show();
    return {
      close: () => {
        instance.current?.hide();
        setTimeout(() => this.destroy(container), 300);
      }
    };
  }
  confirm(options: { title?: string; content: string | ReactNode; }): Observable<boolean> {
    const { title = '提示', content } = options;
    return new Observable(subscribe => {
      const works = this.create({
        title,
        content,
        footer: (
          [{
            text: '取消',
            callback: () => {
              works.close();
              subscribe.next();
              subscribe.complete();
            }
          }, {
            text: '确定',
            callback: () => {
              works.close();
              subscribe.next(true);
              subscribe.complete();
            }
          }]
        )
      });
    });
  }
  alert(content?: string | ReactNode): Observable<boolean> {
    return new Observable(subscriber => {
      const works = this.create({
        title: '提示',
        content,
        footer: [{
          text: '好的',
          callback: () => {
            works.close();
            subscriber.next(true);
            subscriber.complete();
          }
        }]
      });
    });
  }

  destroy(ele: Element) {
    ReactDOM.unmountComponentAtNode(ele);
    ele.remove();
    const index = this.ele.indexOf(ele);
    if (index > -1) {
      this.ele.splice(index, 1);
    }
  }
  destroyAll() {
    this.ele.forEach(el => {
      ReactDOM.unmountComponentAtNode(el);
      el.remove();
    });
  }
}

export const modal = new ModalService();
