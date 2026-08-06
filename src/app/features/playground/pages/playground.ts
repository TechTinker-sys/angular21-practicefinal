import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgFor, NgIf } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Child } from '../../../shared/components/child/child';

@Component({
  selector: 'app-playground',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Child, ReactiveFormsModule, NgFor, NgIf],
  templateUrl: './playground.html'
})
export class Playground {
  count = signal(0);
  doubleCount = computed(() => this.count() * 2);

  increment() {
    this.count.set(this.count() + 1);
  }

  childMessage = signal('');

  handleChildClick(msg: string) {
    this.childMessage.set(msg);
  }

  myForm = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email])
  });

  formSubmitMessage = signal('');

  submitForm() {
    if (this.myForm.valid) {
      this.formSubmitMessage.set('Form submitted successfully.');
      setTimeout(() => this.formSubmitMessage.set(''), 3000);
    } else {
      this.formSubmitMessage.set('Please complete the required fields.');
      setTimeout(() => this.formSubmitMessage.set(''), 3000);
    }
    console.log(this.myForm.value);
  }

  searchResult = signal('');
  private searchSubject = new Subject<string>();

  constructor(private http: HttpClient) {
    this.searchSubject.pipe(debounceTime(500)).subscribe((value) => {
      this.searchResult.set('You searched: ' + value);
    });
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  users = signal<any[]>([]);
  usersLoading = signal(false);

  loadUsers() {
    this.usersLoading.set(true);
    this.http.get<any[]>('https://jsonplaceholder.typicode.com/users').subscribe({
      next: (data) => {
        this.users.set(data);
        this.showToast('Users loaded successfully.');
      },
      error: () => this.showToast('Unable to load users.'),
      complete: () => this.usersLoading.set(false)
    });
  }

  posts = signal<any[]>([]);
  postsLoading = signal(false);
  toast = signal('');
  private toastTimeout?: number;

  postSearch = signal('');
  filteredPosts = computed(() => {
    const q = this.postSearch().trim().toLowerCase();
    return q
      ? this.posts().filter((post) =>
          post.title.toLowerCase().includes(q) || post.body.toLowerCase().includes(q)
        )
      : this.posts();
  });

  lastDeletedPost = signal<any | null>(null);
  private undoTimeoutId?: number;

  inlineEditPostId = signal<number | null>(null);
  inlineEditTitle = signal('');
  inlineEditBody = signal('');

  postForm = new FormGroup({
    title: new FormControl('', Validators.required),
    body: new FormControl('', Validators.required)
  });

  editingPostId = signal<number | null>(null);

  loadPosts() {
    this.postsLoading.set(true);
    this.http.get<any[]>('https://jsonplaceholder.typicode.com/posts').subscribe({
      next: (data) => {
        this.posts.set(data.slice(0, 10));
        this.showToast('Posts loaded successfully.');
      },
      error: () => this.showToast('Unable to load posts.'),
      complete: () => this.postsLoading.set(false)
    });
  }

  createPost() {
    const newPost = this.postForm.value;
    const localPost = { id: Date.now(), ...newPost };

    this.http.post<any>('https://jsonplaceholder.typicode.com/posts', newPost).subscribe({
      next: (created) => {
        this.posts.set([created, ...this.posts()]);
        this.postForm.reset();
        this.showToast('Post created successfully.');
      },
      error: () => {
        this.posts.set([localPost, ...this.posts()]);
        this.postForm.reset();
        this.showToast('Post created locally; API call failed.');
      }
    });
  }

  startEdit(post: any) {
    this.editingPostId.set(post.id);
    this.postForm.setValue({ title: post.title, body: post.body });
  }

  updatePost() {
    const id = this.editingPostId();
    if (!id) return;

    const updatedPost = this.postForm.value;
    this.http.put<any>(`https://jsonplaceholder.typicode.com/posts/${id}`, updatedPost).subscribe({
      next: () => {
        this.posts.set(this.posts().map((p) => (p.id === id ? { ...p, ...updatedPost } : p)));
        this.editingPostId.set(null);
        this.postForm.reset();
        this.showToast('Post updated successfully.');
      },
      error: () => this.showToast('Failed to update post.')
    });
  }

  startInlineEdit(post: any) {
    this.inlineEditPostId.set(post.id);
    this.inlineEditTitle.set(post.title);
    this.inlineEditBody.set(post.body);
  }

  saveInlineEdit(post: any) {
    const updated = {
      ...post,
      title: this.inlineEditTitle(),
      body: this.inlineEditBody()
    };
    this.posts.set(this.posts().map((p) => (p.id === post.id ? updated : p)));
    this.inlineEditPostId.set(null);
    this.showToast('Post updated inline.');
  }

  cancelInlineEdit() {
    this.inlineEditPostId.set(null);
  }

  undoDelete() {
    const deleted = this.lastDeletedPost();
    if (!deleted) return;
    this.posts.set([deleted, ...this.posts()]);
    this.lastDeletedPost.set(null);
    if (this.undoTimeoutId) {
      window.clearTimeout(this.undoTimeoutId);
    }
    this.showToast('Delete undone.');
  }

  deletePost(id: number) {
    const ok = window.confirm('Are you sure you want to delete this post?');
    if (!ok) return;

    const postToDelete = this.posts().find((p) => p.id === id);
    if (!postToDelete) return;

    this.http.delete(`https://jsonplaceholder.typicode.com/posts/${id}`).subscribe({
      next: () => {
        this.posts.set(this.posts().filter((p) => p.id !== id));
        this.lastDeletedPost.set(postToDelete);
        this.showToast('Post deleted. Undo available.');
        if (this.undoTimeoutId) {
          window.clearTimeout(this.undoTimeoutId);
        }
        this.undoTimeoutId = window.setTimeout(() => {
          this.lastDeletedPost.set(null);
        }, 5000);
      },
      error: () => this.showToast('Failed to delete post.')
    });
  }

  cancelEdit() {
    this.editingPostId.set(null);
    this.postForm.reset();
  }

  private showToast(message: string) {
    if (this.toastTimeout) {
      window.clearTimeout(this.toastTimeout);
    }
    this.toast.set(message);
    this.toastTimeout = window.setTimeout(() => this.toast.set(''), 3000);
  }
}
